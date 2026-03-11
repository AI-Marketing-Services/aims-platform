import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const services = await db.serviceArm.findMany({
    orderBy: [{ pillar: "asc" }, { sortOrder: "asc" }],
    select: {
      id: true,
      slug: true,
      name: true,
      pillar: true,
      status: true,
      asanaProjectGid: true,
      asanaAssigneeGid: true,
      asanaTaskTemplate: true,
      ctaUrl: true,
      defaultAssignee: true,
    },
  });
  return NextResponse.json(services);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, asanaProjectGid, asanaAssigneeGid, asanaTaskTemplate, ctaUrl, defaultAssignee } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const updated = await db.serviceArm.update({
    where: { id },
    data: {
      asanaProjectGid: asanaProjectGid || null,
      asanaAssigneeGid: asanaAssigneeGid || null,
      asanaTaskTemplate: asanaTaskTemplate || null,
      ctaUrl: ctaUrl || null,
      defaultAssignee: defaultAssignee || null,
    },
  });
  return NextResponse.json(updated);
}
