import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique name to prevent collisions
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const originalExtension = file.name.split(".").pop();
    const filename = `${uniqueSuffix}.${originalExtension}`;
    
    // Save to the public/uploads directory
    const uploadPath = join(process.cwd(), "public", "uploads", filename);
    await writeFile(uploadPath, buffer);

    const imageUrl = `/uploads/${filename}`;

    return NextResponse.json({
      message: "Image uploaded successfully.",
      imageUrl,
    });
  } catch (error: any) {
    console.error("Upload API error:", error);
    return NextResponse.json(
      { error: "Failed to upload image." },
      { status: 500 }
    );
  }
}
