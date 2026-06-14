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
import {
  hashPassword,
  verifyPassword,
  signTokenPair,
  verifyRefreshToken,
} from "../services/jwtService";

const router = express.Router();

const skipEmailVerification = process.env.SKIP_EMAIL_VERIFICATION === "1";

if (skipEmailVerification) {
  console.warn(
    "SKIP_EMAIL_VERIFICATION is enabled — new users are auto-verified and verification emails are not sent."
  );
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
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters long" });
    }

    const normalizedEmail = email.toLowerCase();
    const existingUser = await getUserByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
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
        emailVerified: skipEmailVerification,
        passwordHash,
        createdBy: null,
        createdAt: new Date(),
      })
      .returning();

    if (!skipEmailVerification) {
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

    const user = formatUserResponse({
      ...appUser,
      emailVerified: skipEmailVerification || appUser.emailVerified || false,
    });

    res.status(201).json({
      message: skipEmailVerification
        ? "User created successfully."
        : "User created successfully. Please check your email to verify your account.",
      ...signTokenPair(appUser.id, appUser.email),
      user,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", authRateLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const appUser = await getUserByEmail(email);
    if (!appUser || !appUser.passwordHash) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const passwordValid = await verifyPassword(password, appUser.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!skipEmailVerification && !appUser.emailVerified) {
      return res.status(403).json({
        error: "Email not verified",
        message: "Please verify your email before logging in.",
      });
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
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post(
  "/refresh",
  authRateLimiter,
  async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: "Refresh token is required" });
      }

      const payload = verifyRefreshToken(refreshToken);
      const [appUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, payload.sub));

      if (!appUser) {
        return res
          .status(401)
          .json({ error: "Invalid or expired refresh token" });
      }

      const tokens = signTokenPair(appUser.id, appUser.email);

      res.json(tokens);
    } catch (error) {
      console.error("Refresh token error:", error);
      return res
        .status(401)
        .json({ error: "Invalid or expired refresh token" });
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
        return res.status(400).json({ error: "Email is required" });
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
        return res
          .status(500)
          .json({ error: "Failed to send password reset email" });
      }

      res.json({
        message:
          "If an account with that email exists, a password reset link has been sent.",
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ error: "Internal server error" });
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
        return res
          .status(400)
          .json({ error: "Token and new password are required" });
      }

      if (newPassword.length < 8) {
        return res
          .status(400)
          .json({ error: "Password must be at least 8 characters long" });
      }

      const tokenData = resetTokens.get(token);
      if (!tokenData) {
        return res
          .status(400)
          .json({ error: "Invalid or expired reset token" });
      }

      if (tokenData.expiresAt < new Date()) {
        resetTokens.delete(token);
        return res.status(400).json({ error: "Reset token has expired" });
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
      res.status(500).json({ error: "Internal server error" });
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
        return res
          .status(400)
          .json({ error: "Verification token is required" });
      }

      const tokenData = verificationTokens.get(token);
      if (!tokenData) {
        return res
          .status(400)
          .json({ error: "Invalid or expired verification token" });
      }

      if (tokenData.expiresAt < new Date()) {
        verificationTokens.delete(token);
        return res
          .status(400)
          .json({ error: "Verification token has expired" });
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
      res.status(500).json({ error: "Internal server error" });
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
        return res.status(400).json({ error: "Email is required" });
      }

      const appUser = await getUserByEmail(email);

      if (!appUser) {
        return res.json({
          message:
            "If an account with that email exists and is unverified, a verification email has been sent.",
        });
      }

      if (appUser.emailVerified) {
        return res.status(400).json({ error: "Email is already verified" });
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
        return res
          .status(500)
          .json({ error: "Failed to send verification email" });
      }

      res.json({
        message:
          "If an account with that email exists and is unverified, a verification email has been sent.",
      });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.get(
  "/user-info",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      if (!req.appUser) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const user = formatUserResponse(req.appUser);

      res.json({
        user,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.post("/change-photo", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { photo_url } = req.body;
    if (!photo_url) {
      return res.status(400).json({ error: "Photo URL is required" });
    }

    if (!req.appUser) {
      return res.status(401).json({ error: "Unauthorized" });
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
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
