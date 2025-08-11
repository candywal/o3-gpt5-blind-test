import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function GET() {
  const store = getStore();
  const stats = store.getStats();
  return NextResponse.json(stats);
}


