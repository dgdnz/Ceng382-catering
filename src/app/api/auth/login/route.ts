import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signJWT } from "@/lib/auth";
import { sendEmail } from "@/lib/nodemailer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials." },
        { status: 401 }
      );
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials." },
        { status: 401 }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Log the OTP action
    await prisma.log.create({
      data: {
        action: "OTP_GENERATED",
        details: `OTP generated for user: ${email}`,
        userId: user.id,
      },
    });

    // Send OTP via Email (or fallback to terminal output)
    await sendEmail({
      to: user.email,
      subject: "🔒 Your 2FA OTP Code - Pink Dessert Catering",
      text: `Your 6-digit verification code is: ${otp}. This code is valid for 5 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #fff0f5; padding: 30px; border-radius: 15px; text-align: center; color: #4a0e2e;">
          <h2 style="color: #ff69b4;">🎂 Pink Dessert Catering 🎂</h2>
          <p style="font-size: 1.1em;">Hello! Use the following 6-digit code to complete your secure login:</p>
          <div style="display: inline-block; font-size: 2.2em; font-weight: bold; background-color: #ffb6c1; color: white; padding: 15px 30px; border-radius: 10px; letter-spacing: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="font-size: 0.9em; color: #747d8c;">This code will expire in 5 minutes. If you did not request this, please secure your account.</p>
        </div>
      `,
    });

    // Create a temporary pre-auth JWT containing user metadata and the true OTP
    // This allows us to verify the OTP in a stateless way in the next API route
    const preAuthPayload = {
      userId: user.id,
      role: user.role,
      otp, // Save the OTP inside the JWT safely
    };

    // Pre-auth JWT expires in 5 minutes
    const preAuthToken = await signJWT(preAuthPayload, "5m");

    const response = NextResponse.json({
      message: "2FA code sent to email. Please verify.",
      requires2FA: true,
    });

    // Save as HTTP-only cookie
    response.cookies.set("pre_auth_token", preAuthToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 300, // 5 minutes
    });

    return response;
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
