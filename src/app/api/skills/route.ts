import { NextResponse } from "next/server";
import { listSkills } from "@/server/prompts";

/** Lists available design skills (id, name, description) for UI selection. */
export async function GET() {
  const skills = listSkills().map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
  }));
  return NextResponse.json({ skills });
}
