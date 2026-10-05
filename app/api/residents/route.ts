import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  DISTRICT_META,
  DISTRICT_ORDER,
  districtMeta,
} from "@/lib/residents";
import { residentLite } from "@/lib/serializers";

export const dynamic = "force-dynamic";

// GET /api/residents - all residents grouped by district (public).
export async function GET() {
  const residents = await prisma.resident.findMany({
    orderBy: { name: "asc" },
  });

  const districts = DISTRICT_ORDER.map((district) => ({
    name: district,
    color: DISTRICT_META[district].color,
    description: districtMeta(district).description,
    residents: residents
      .filter((resident) => resident.district === district)
      .map(residentLite),
  }));

  return NextResponse.json({
    count: residents.length,
    districts,
  });
}
