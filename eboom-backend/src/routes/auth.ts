import express, { Request, Response } from "express";
import supabase from "../supabaseClient";
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
import { TUser } from "../types/TUser";

const router = express.Router();

interface TokenData {
  userId: string;
  email: string;
  expiresAt: Date;
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

supabase.from("users").insert({
  id: "sdsdffwefwefwefewfe",
  email: "test@test.com",
  first_name: "John",
  last_name: "Doe",
  age: 20,
  photo_url: "https://example.com/photo.jpg",
  role: "user",
  created_at: new Date().toISOString(),
});

router.post("/signup", authRateLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password, first_name, last_name, age, photo_url } = req.body;

    console.log(req.body)

    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters long" });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: first_name || "",
          last_name: last_name || "",
          age: age || null,
          photo_url: photo_url || null,
          role: "user",
        },
        emailRedirectTo: `${
          process.env.APP_URL || "http://localhost:3000"
        }/verify-email`,
      },
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!data.user) {
      return res.status(500).json({ error: "Failed to create user" });
    }

    console.log("data.user", data);

    const verificationToken = uuidv4();
    verificationTokens.set(verificationToken, {
      userId: data.user.id,
      email: data.user.email!,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    try {
      await sendVerificationEmail(data.user.email!, verificationToken);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
    }

    const user: TUser = {
      id: data.user.id,
      email: data.user.email!,
      first_name: data.user.user_metadata?.first_name || first_name || "",
      last_name: data.user.user_metadata?.last_name || last_name || "",
      age: data.user.user_metadata?.age || age || undefined,
      photo_url: data.user.user_metadata?.photo_url || photo_url || undefined,
    };

    console.log("data.session", data.session);

    res.status(201).json({
      message:
        "User created successfully. Please check your email to verify your account.",
      accessToken: data.session?.access_token,
      refreshToken: data.session?.refresh_token,
      expiresIn: data.session?.expires_in,
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

    // Sign in user with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!data.user || !data.session) {
      return res.status(500).json({ error: "Failed to create session" });
    }

    // Check if email is verified
    if (!data.user.email_confirmed_at) {
      return res.status(403).json({
        error: "Email not verified",
        message: "Please verify your email before logging in.",
      });
    }

    const user: TUser = {
      id: data.user.id,
      email: data.user.email!,
      first_name: data.user.user_metadata?.first_name || "",
      last_name: data.user.user_metadata?.last_name || "",
      age: data.user.user_metadata?.age || undefined,
      photo_url: data.user.user_metadata?.photo_url || undefined,
    };

    res.json({
      message: "Login successful",
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in,
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

      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error || !data.session) {
        return res
          .status(401)
          .json({ error: "Invalid or expired refresh token" });
      }

      res.json({
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in,
      });
    } catch (error) {
      console.error("Refresh token error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.post("/logout", authMiddleware, async (req: Request, res: Response) => {
  try {
    const auth = req.headers.authorization;
    const token = auth?.replace(/^Bearer\s+/i, "");

    if (token) {
      await supabase.auth.signOut();
    }

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
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

      let user;
      try {
        const { data: users, error: userError } =
          await supabase.auth.admin.listUsers();

        if (userError) {
          console.error("Error fetching users:", userError);
          return res.json({
            message:
              "If an account with that email exists, a password reset link has been sent.",
          });
        }

        user = users?.users.find(
          (u) => u.email?.toLowerCase() === email.toLowerCase()
        );
      } catch (error) {
        console.error("Error checking user:", error);
        return res.json({
          message:
            "If an account with that email exists, a password reset link has been sent.",
        });
      }

      if (!user || !user.email) {
        return res.json({
          message:
            "If an account with that email exists, a password reset link has been sent.",
        });
      }

      const resetToken = uuidv4();
      resetTokens.set(resetToken, {
        userId: user.id,
        email: user.email,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      });

      // Send password reset email
      try {
        await sendPasswordResetEmail(user.email, resetToken);
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

/**
 * POST /api/auth/reset-password
 * Reset password using token
 */
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

      // Verify token
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

      const { error: updateError } = await supabase.auth.admin.updateUserById(
        tokenData.userId,
        { password: newPassword }
      );

      if (updateError) {
        return res.status(400).json({ error: updateError.message });
      }

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

      const { error: updateError } = await supabase.auth.admin.updateUserById(
        tokenData.userId,
        { email_confirm: true }
      );

      if (updateError) {
        return res.status(400).json({ error: updateError.message });
      }

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

      let user;
      try {
        const { data: users, error: userError } =
          await supabase.auth.admin.listUsers();

        if (userError) {
          return res.status(500).json({ error: "Failed to check user status" });
        }

        user = users?.users.find(
          (u) => u.email?.toLowerCase() === email.toLowerCase()
        );
      } catch (error) {
        console.error("Error checking user:", error);
        return res.status(500).json({ error: "Failed to check user status" });
      }

      if (!user || !user.email) {
        return res.json({
          message:
            "If an account with that email exists and is unverified, a verification email has been sent.",
        });
      }

      if (user.email_confirmed_at) {
        return res.status(400).json({ error: "Email is already verified" });
      }

      const verificationToken = uuidv4();
      verificationTokens.set(verificationToken, {
        userId: user.id,
        email: user.email,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      try {
        await sendVerificationEmail(user.email, verificationToken);
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
      if (!req.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { data: { user } } = await supabase.auth.getUser()

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
    console.log(req)
    if (!photo_url) {
      return res.status(400).json({ error: "Photo URL is required" });
    }
    const { error } = await supabase.auth.updateUser({
      data: { photo_url },
    });
    if (error) throw error;
    res.json({ message: "Photo updated successfully" });
  } catch (error) {
    console.error("Change photo error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// router.post('/auth/login-with-google', async (req: Request, res: Response) => {
//   try {
//     const { token } = req.body;
//     const { data, error } = await supabase.auth.signInWithIdToken({
//       provider: 'google',
//       token: token,
//     });
//     if (error) {
//       return res.status(400).json({ error: error.message });
//     }
//     res.json({ data });
//     if (!data.user || !data.session) {
//       return res.status(500).json({ error: 'Failed to create session' });
//     }

//     res.json({
//       message: 'Login successful',
//       accessToken: data.session.access_token,
//       refreshToken: data.session.refresh_token,
//       expiresIn: data.session.expires_in,
//       user: {
//         id: data.user.id,
//         email: data.user.email,
//         name: data.user.user_metadata?.name,
//         role: data.user.user_metadata?.role || 'user',
//       },
//     });
//   } catch (error) {
//     console.error('Login with Google error:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// });

export default router;
