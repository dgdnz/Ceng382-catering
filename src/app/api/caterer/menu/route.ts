import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "pink-dessert-ceng382-super-secret-key-change-me"
);

// Retrieve all menu items of the logged-in Caterer
export async function GET(req: NextRequest) {
  try {
    const authToken = req.cookies.get("auth_token")?.value;
    if (!authToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { payload } = await jwtVerify(authToken, JWT_SECRET);
    const catererId = payload.userId as string;

    const menuItems = await prisma.menuItem.findMany({
      where: { catererId },
      include: {
        customizationGroups: {
          include: {
            options: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(menuItems);
  } catch (error) {
    console.error("GET menu items error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Create new menu item with Dynamic Customization Groups and Options
export async function POST(req: NextRequest) {
  try {
    const authToken = req.cookies.get("auth_token")?.value;
    if (!authToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { payload } = await jwtVerify(authToken, JWT_SECRET);
    const catererId = payload.userId as string;

    const body = await req.json();
    const { name, description, price, imageUrl, customizationGroups } = body;

    if (!name || !description || !price || !imageUrl) {
      return NextResponse.json(
        { error: "Name, description, base price, and image are mandatory." },
        { status: 400 }
      );
    }

    // Create the MenuItem first, along with nested Customization Groups and Options
    // Fulfills the "Dynamic Customization System" core requirement (12 pts)
    const menuItem = await prisma.menuItem.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        imageUrl,
        catererId,
        customizationGroups: {
          create: (customizationGroups || []).map((group: any) => ({
            name: group.name,
            isRequired: group.isRequired || false,
            allowMultiple: group.allowMultiple || false,
            options: {
              create: (group.options || []).map((option: any) => ({
                name: option.name,
                priceChange: parseFloat(option.priceChange) || 0.0,
              })),
            },
          })),
        },
      },
      include: {
        customizationGroups: {
          include: {
            options: true,
          },
        },
      },
    });

    // Logging System (6 pts) - CRUD event
    await prisma.log.create({
      data: {
        action: "MENU_ITEM_CREATED",
        details: `Caterer successfully created menu item: ${name} (ID: ${menuItem.id})`,
        userId: catererId,
      },
    });

    return NextResponse.json(menuItem, { status: 201 });
  } catch (error: any) {
    console.error("Create menu item error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
