import express, { Request, Response } from "express";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "../services/emailService";
import { v4 as uuidv4 } from "uuid";
import authMiddleware from "../middleware/auth";
import {
  authRateLimiter,
  passwordResetRateLimiter,
  emailVerificationRateLimiter,
} from "../middleware/rateLimiter";
import { db } from "../db/client";
import { User, users } from "../db/schema";
import { eq } from "drizzle-orm";
import { ErrorKeys } from "../errors/errorKeys";
import { sendError } from "../errors/sendError";
import {
  hashPassword,
  verifyPassword,
  signTokenPair,
  verifyRefreshToken,
} from "../services/jwtService";

const router = express.Router();

function shouldSkipEmailVerification(): boolean {
  const raw = process.env.SKIP_EMAIL_VERIFICATION?.trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

interface TokenData {
  userId: number;
  email: string;
  expiresAt: Date;
}

async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const [appUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()));
    return appUser ?? null;
  } catch (error) {
    console.error("Error fetching user by email:", error);
    return null;
  }
}

function formatUserResponse(appUser: User): Partial<User> {
  return {
    id: appUser.id,
    email: appUser.email,
    firstName: appUser.firstName,
    lastName: appUser.lastName,
    age: appUser.age,
    photoUrl: appUser.photoUrl,
    phone: appUser.phone,
    emailVerified: appUser.emailVerified || false,
  };
}

const resetTokens = new Map<string, TokenData>();
const verificationTokens = new Map<string, TokenData>();

setInterval(() => {
  const now = new Date();
  for (const [token, data] of resetTokens.entries()) {
    if (data.expiresAt < now) {
      resetTokens.delete(token);
    }
  }
  for (const [token, data] of verificationTokens.entries()) {
    if (data.expiresAt < now) {
      verificationTokens.delete(token);
    }
  }
}, 60 * 60 * 1000);

router.post("/signup", authRateLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password, first_name, last_name, age, photo_url } = req.body;

    if (!email || !password || !first_name || !last_name) {
      return sendError(res, ErrorKeys.validation.failed, 400);
    }

    if (password.length < 8) {
      return sendError(res, ErrorKeys.auth.passwordTooShort, 400);
    }

    const normalizedEmail = email.toLowerCase();
    const existingUser = await getUserByEmail(normalizedEmail);
    if (existingUser) {
      return sendError(res, ErrorKeys.auth.emailExists, 400);
    }

    const passwordHash = await hashPassword(password);

    const [appUser] = await db
      .insert(users)
      .values({
        email: normalizedEmail,
        firstName: first_name,
        lastName: last_name,
        age,
        photoUrl: photo_url,
        emailVerified: shouldSkipEmailVerification(),
        passwordHash,
        createdBy: null,
        createdAt: new Date(),
      })
      .returning();

    if (!shouldSkipEmailVerification()) {
      const verificationToken = uuidv4();
      verificationTokens.set(verificationToken, {
        userId: appUser.id,
        email: appUser.email,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      try {
        await sendVerificationEmail(appUser.email, verificationToken);
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
      }
    }

    const skipVerification = shouldSkipEmailVerification();
    const user = formatUserResponse({
      ...appUser,
      emailVerified: skipVerification || appUser.emailVerified || false,
    });

    res.status(201).json({
      message: skipVerification
        ? "User created successfully."
        : "User created successfully. Please check your email to verify your account.",
      ...(skipVerification ? signTokenPair(appUser.id, appUser.email) : {}),
      user,
    });
  } catch (error) {
    console.error("Signup error:", error);
    sendError(res, ErrorKeys.common.internal, 500);
  }
});

router.post("/login", authRateLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, ErrorKeys.validation.failed, 400);
    }

    const appUser = await getUserByEmail(email);
    if (!appUser || !appUser.passwordHash) {
      return sendError(res, ErrorKeys.auth.invalidCredentials, 401);
    }

    const passwordValid = await verifyPassword(password, appUser.passwordHash);
    if (!passwordValid) {
      return sendError(res, ErrorKeys.auth.invalidCredentials, 401);
    }

    if (!shouldSkipEmailVerification() && !appUser.emailVerified) {
      return sendError(res, ErrorKeys.auth.emailNotVerified, 403);
    }

    const tokens = signTokenPair(appUser.id, appUser.email);
    const user = formatUserResponse(appUser);

    res.json({
      message: "Login successful",
      ...tokens,
      user,
    });
  } catch (error) {
    console.error("Login error:", error);
    sendError(res, ErrorKeys.common.internal, 500);
  }
});

router.post(
  "/refresh",
  authRateLimiter,
  async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return sendError(res, ErrorKeys.validation.failed, 400);
      }

      const payload = verifyRefreshToken(refreshToken);
      const [appUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, payload.sub));

      if (!appUser) {
        return sendError(res, ErrorKeys.common.invalidToken, 401);
      }

      const tokens = signTokenPair(appUser.id, appUser.email);

      res.json(tokens);
    } catch (error) {
      console.error("Refresh token error:", error);
      return sendError(res, ErrorKeys.common.invalidToken, 401);
    }
  }
);

router.post("/logout", authMiddleware, async (_req: Request, res: Response) => {
  res.json({ message: "Logged out successfully" });
});

router.post(
  "/forgot-password",
  passwordResetRateLimiter,
  async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return sendError(res, ErrorKeys.validation.failed, 400);
      }

      const appUser = await getUserByEmail(email);

      if (!appUser) {
        return res.json({
          message:
            "If an account with that email exists, a password reset link has been sent.",
        });
      }

      const resetToken = uuidv4();
      resetTokens.set(resetToken, {
        userId: appUser.id,
        email: appUser.email,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      });

      try {
        await sendPasswordResetEmail(appUser.email, resetToken);
      } catch (emailError) {
        console.error("Failed to send password reset email:", emailError);
        return sendError(res, ErrorKeys.auth.sendEmailFailed, 500);
      }

      res.json({
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      sendError(res, ErrorKeys.common.internal, 500);
    }
  }
);

router.post(
  "/reset-password",
  passwordResetRateLimiter,
  async (req: Request, res: Response) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return sendError(res, ErrorKeys.validation.failed, 400);
      }

      if (newPassword.length < 8) {
        return sendError(res, ErrorKeys.auth.passwordTooShort, 400);
      }

      const tokenData = resetTokens.get(token);
      if (!tokenData) {
        return sendError(res, ErrorKeys.auth.resetTokenInvalid, 400);
      }

      if (tokenData.expiresAt < new Date()) {
        resetTokens.delete(token);
        return sendError(res, ErrorKeys.auth.resetTokenExpired, 400);
      }

      const passwordHash = await hashPassword(newPassword);

      await db
        .update(users)
        .set({
          passwordHash,
          lastModifiedAt: new Date(),
        })
        .where(eq(users.id, tokenData.userId));

      resetTokens.delete(token);

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      sendError(res, ErrorKeys.common.internal, 500);
    }
  }
);

router.get(
  "/verify-email",
  emailVerificationRateLimiter,
  async (req: Request, res: Response) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== "string") {
        return sendError(res, ErrorKeys.auth.verificationRequired, 400);
      }

      const tokenData = verificationTokens.get(token);
      if (!tokenData) {
        return sendError(res, ErrorKeys.auth.verificationInvalid, 400);
      }

      if (tokenData.expiresAt < new Date()) {
        verificationTokens.delete(token);
        return sendError(res, ErrorKeys.auth.verificationExpired, 400);
      }

      await db
        .update(users)
        .set({
          emailVerified: true,
          lastModifiedAt: new Date(),
        })
        .where(eq(users.id, tokenData.userId));

      verificationTokens.delete(token);

      res.json({ message: "Email verified successfully" });
    } catch (error) {
      console.error("Verify email error:", error);
      sendError(res, ErrorKeys.common.internal, 500);
    }
  }
);

router.post(
  "/resend-verification",
  emailVerificationRateLimiter,
  async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return sendError(res, ErrorKeys.validation.failed, 400);
      }

      const appUser = await getUserByEmail(email);

      if (!appUser) {
        return res.json({
          message:
            "If an account with that email exists and is unverified, a verification email has been sent.",
        });
      }

      if (appUser.emailVerified) {
        return sendError(res, ErrorKeys.auth.alreadyVerified, 400);
      }

      const verificationToken = uuidv4();
      verificationTokens.set(verificationToken, {
        userId: appUser.id,
        email: appUser.email,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      try {
        await sendVerificationEmail(appUser.email, verificationToken);
      } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
        return sendError(res, ErrorKeys.auth.sendEmailFailed, 500);
      }

      res.json({
        message:
          "If an account with that email exists and is unverified, a verification email has been sent.",
      });
    } catch (error) {
      console.error("Resend verification error:", error);
      sendError(res, ErrorKeys.common.internal, 500);
    }
  }
);

router.get(
  "/user-info",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      if (!req.appUser) {
        return sendError(res, ErrorKeys.common.unauthorized, 401);
      }
      const user = formatUserResponse(req.appUser);

      res.json({
        user,
      });
    } catch (error) {
      console.error("Get user error:", error);
      sendError(res, ErrorKeys.common.internal, 500);
    }
  }
);

router.post("/change-photo", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { photo_url } = req.body;
    if (!photo_url) {
      return sendError(res, ErrorKeys.auth.photoRequired, 400);
    }

    if (!req.appUser) {
      return sendError(res, ErrorKeys.common.unauthorized, 401);
    }

    await db
      .update(users)
      .set({
        photoUrl: photo_url,
        lastModifiedAt: new Date(),
      })
      .where(eq(users.id, req.appUser.id));

    res.json({ message: "Photo updated successfully" });
  } catch (error) {
    console.error("Change photo error:", error);
    sendError(res, ErrorKeys.common.internal, 500);
  }
});

export default router;
