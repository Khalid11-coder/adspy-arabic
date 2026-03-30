import { NextResponse } from "next/server";
import { MOCK_ADS } from "@/lib/mock-data";

export async function GET() {
  const counts = MOCK_ADS.reduce<Record<string, number>>((acc, ad) => {
    acc[ad.category] = (acc[ad.category] || 0) + 1;
    return acc;
  }, {});

  const categories = [
    { label: "الكل", count: MOCK_ADS.length },
    ...Object.entries(counts).map(([label, count]) => ({ label, count })),
  ];

  return NextResponse.json(categories);
}
