import { NextResponse } from "next/server";
import { listWorkspaceProjects } from "@/lib/asana";

export async function GET() {
  try {
    const projects = await listWorkspaceProjects();
    return NextResponse.json(projects);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch Asana projects" }, { status: 500 });
  }
}
