import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { listWorkspaceProjects } from "@/lib/asana";

export async function GET() {
  const { userId, sessionClaims } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (!role || !["ADMIN", "SUPER_ADMIN"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const projects = await listWorkspaceProjects();
    return NextResponse.json(projects);
  } catch (err) {
    console.error("Failed to fetch Asana projects:", err);
    return NextResponse.json({ error: "Failed to fetch Asana projects" }, { status: 500 });
  }
}
