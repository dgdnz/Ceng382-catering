import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, role, catererName, latitude, longitude } = body;

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: "Email, password, and role are required." },
        { status: 400 }
      );
    }

    // Check if role is valid
    if (!["ADMIN", "CATERER", "USER"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role selected." },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists." },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        catererName: role === "CATERER" ? catererName || "Unnamed Caterer" : null,
        latitude: role === "CATERER" ? parseFloat(latitude) || null : null,
        longitude: role === "CATERER" ? parseFloat(longitude) || null : null,
      },
    });

    // Logging System (6 pts) - Auth events
    await prisma.log.create({
      data: {
        action: "USER_REGISTER",
        details: `Successfully registered new user with role: ${role}`,
        userId: user.id,
      },
    });

    return NextResponse.json(
      { message: "Registration successful. You can now log in.", userId: user.id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
