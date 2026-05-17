import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "pink-dessert-ceng382-super-secret-key-change-me"
);

// Secure helper to verify caterer owns the item
async function verifyOwnership(req: NextRequest, menuItemId: string) {
  const authToken = req.cookies.get("auth_token")?.value;
  if (!authToken) return null;

  try {
    const { payload } = await jwtVerify(authToken, JWT_SECRET);
    const catererId = payload.userId as string;

    const menuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
    });

    if (!menuItem || menuItem.catererId !== catererId) {
      return null;
    }

    return catererId;
  } catch {
    return null;
  }
}

// UPDATE Menu Item + Dynamic Customizations
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const menuItemId = params.id;
    const catererId = await verifyOwnership(req, menuItemId);
    if (!catererId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, price, imageUrl, customizationGroups } = body;

    if (!name || !description || !price || !imageUrl) {
      return NextResponse.json(
        { error: "Name, description, price, and image are required." },
        { status: 400 }
      );
    }

    // Use a transaction to securely wipe old customizations and create new ones
    const updatedMenuItem = await prisma.$transaction(async (tx) => {
      // 1. Delete all old customization groups (cascades and deletes options automatically)
      await tx.customizationGroup.deleteMany({
        where: { menuItemId },
      });

      // 2. Update menu item and add new dynamic groups
      return await tx.menuItem.update({
        where: { id: menuItemId },
        data: {
          name,
          description,
          price: parseFloat(price),
          imageUrl,
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
    });

    // Logging System (6 pts)
    await prisma.log.create({
      data: {
        action: "MENU_ITEM_UPDATED",
        details: `Caterer successfully updated menu item: ${name} (ID: ${menuItemId})`,
        userId: catererId,
      },
    });

    return NextResponse.json(updatedMenuItem);
  } catch (error: any) {
    console.error("Update menu item error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE Menu Item
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const menuItemId = params.id;
    const catererId = await verifyOwnership(req, menuItemId);
    if (!catererId) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const menuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
    });

    if (!menuItem) {
      return NextResponse.json({ error: "Menu item not found." }, { status: 404 });
    }

    // Delete item (cascades and deletes groups/options)
    await prisma.menuItem.delete({
      where: { id: menuItemId },
    });

    // Logging System (6 pts)
    await prisma.log.create({
      data: {
        action: "MENU_ITEM_DELETED",
        details: `Caterer successfully deleted menu item: ${menuItem.name} (ID: ${menuItemId})`,
        userId: catererId,
      },
    });

    return NextResponse.json({ message: "Menu item successfully deleted." });
  } catch (error: any) {
    console.error("Delete menu item error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
