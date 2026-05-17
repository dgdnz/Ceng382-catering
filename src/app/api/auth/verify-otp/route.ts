import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signJWT, verifyJWT } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Verification code is required." },
        { status: 400 }
      );
    }

    // Get the pre-auth cookie
    const preAuthTokenCookie = req.cookies.get("pre_auth_token");
    if (!preAuthTokenCookie) {
      return NextResponse.json(
        { error: "Session expired. Please log in again." },
        { status: 401 }
      );
    }

    // Verify JWT payload
    const payload = await verifyJWT(preAuthTokenCookie.value);
    if (!payload || !payload.userId || !payload.otp) {
      return NextResponse.json(
        { error: "Session expired or invalid. Please log in again." },
        { status: 401 }
      );
    }

    const { userId, role, otp: correctOtp } = payload as {
      userId: string;
      role: string;
      otp: string;
    };

    // Verify OTP matches
    if (code !== correctOtp) {
      // Create failure log
      await prisma.log.create({
        data: {
          action: "AUTH_FAIL_BAD_OTP",
          details: `User submitted invalid OTP code: ${code}`,
          userId: userId,
        },
      });

      return NextResponse.json(
        { error: "Invalid verification code." },
        { status: 400 }
      );
    }

    // OTP is valid! Log authentication event
    await prisma.log.create({
      data: {
        action: "USER_LOGIN_SUCCESS",
        details: `Successfully completed 2FA login for role: ${role}`,
        userId: userId,
      },
    });

    // Generate final long-lived secure auth token
    const finalPayload = { userId, role };
    const authToken = await signJWT(finalPayload, "7d"); // 7 days duration

    const response = NextResponse.json({
      message: "Login successful.",
      role,
    });

    // Save HTTP-only cookie
    response.cookies.set("auth_token", authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    });

    // Clear the pre-auth token cookie
    response.cookies.delete("pre_auth_token");

    return response;
  } catch (error: any) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
