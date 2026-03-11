import { NextResponse } from "next/server";
import { listWorkspaceUsers } from "@/lib/asana";

export async function GET() {
  try {
    const users = await listWorkspaceUsers();
    return NextResponse.json(users);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch Asana users" }, { status: 500 });
  }
}
