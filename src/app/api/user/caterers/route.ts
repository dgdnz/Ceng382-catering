import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic"; // Force dynamic rendering since we read searchParams

// Haversine formula to calculate distance between coordinates in Kilometers
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userLatStr = searchParams.get("lat");
    const userLngStr = searchParams.get("lng");

    if (!userLatStr || !userLngStr) {
      return NextResponse.json(
        { error: "User location (latitude and longitude) is required." },
        { status: 400 }
      );
    }

    const userLat = parseFloat(userLatStr);
    const userLng = parseFloat(userLngStr);

    // 1. Fetch all caterers
    const caterers = await prisma.user.findMany({
      where: {
        role: "CATERER",
        latitude: { not: null },
        longitude: { not: null },
      },
      include: {
        menuItems: {
          include: {
            ratings: true,
          },
        },
        ratingsReceived: true,
      },
    });

    // 2. Map and calculate distances & dynamic average ratings
    const nearbyCaterers = caterers
      .map((caterer) => {
        const distance = calculateDistance(
          userLat,
          userLng,
          caterer.latitude!,
          caterer.longitude!
        );

        // Calculate average Caterer rating
        const totalCatererRatings = caterer.ratingsReceived.length;
        const avgCatererRating =
          totalCatererRatings > 0
            ? caterer.ratingsReceived.reduce((sum, r) => sum + r.score, 0) /
              totalCatererRatings
            : 0;

        // Map menu items with their dynamic average ratings
        const menuItemsWithRatings = caterer.menuItems.map((item) => {
          const totalItemRatings = item.ratings.length;
          const avgItemRating =
            totalItemRatings > 0
              ? item.ratings.reduce((sum, r) => sum + r.score, 0) / totalItemRatings
              : 0;

          return {
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price,
            imageUrl: item.imageUrl,
            avgRating: avgItemRating,
            totalRatings: totalItemRatings,
          };
        });

        return {
          id: caterer.id,
          catererName: caterer.catererName || "Unnamed Patisserie",
          email: caterer.email,
          latitude: caterer.latitude,
          longitude: caterer.longitude,
          distance: parseFloat(distance.toFixed(2)), // Keep 2 decimal places
          avgCatererRating: parseFloat(avgCatererRating.toFixed(1)),
          totalCatererRatings,
          menuItems: menuItemsWithRatings,
        };
      })
      // 3. ONLY show caterers that are close to them (e.g. within 30 km radius)
      .filter((caterer) => caterer.distance <= 30.0)
      // 4. Sort by closest distance first
      .sort((a, b) => a.distance - b.distance);

    return NextResponse.json(nearbyCaterers);
  } catch (error: any) {
    console.error("GET nearby caterers error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
