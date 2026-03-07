import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { Webhook } from "svix"
import { db } from "@/lib/db"

interface ClerkWebhookEvent {
  data: Record<string, unknown>
  object: string
  type: string
}

export async function POST(req: Request) {
  const headersList = await headers()
  const svixId = headersList.get("svix-id")
  const svixTimestamp = headersList.get("svix-timestamp")
  const svixSignature = headersList.get("svix-signature")

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 })
  }

  const body = await req.text()

  const clerkWebhookSecret = process.env.CLERK_WEBHOOK_SECRET
  if (!clerkWebhookSecret) {
    console.error("CLERK_WEBHOOK_SECRET is not configured")
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 })
  }

  const wh = new Webhook(clerkWebhookSecret)
  let event: ClerkWebhookEvent

  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkWebhookEvent
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const { type, data } = event

  try {
    switch (type) {
      case "user.created": {
        const email =
          (data.email_addresses as Array<{ email_address: string }>)?.[0]
            ?.email_address ?? ""
        const firstName = (data.first_name as string) ?? ""
        const lastName = (data.last_name as string) ?? ""
        const name = [firstName, lastName].filter(Boolean).join(" ") || null

        await db.user.create({
          data: {
            clerkId: data.id as string,
            email,
            name,
            avatarUrl: (data.image_url as string) ?? null,
          },
        })
        break
      }

      case "user.updated": {
        const email =
          (data.email_addresses as Array<{ email_address: string }>)?.[0]
            ?.email_address ?? ""
        const firstName = (data.first_name as string) ?? ""
        const lastName = (data.last_name as string) ?? ""
        const name = [firstName, lastName].filter(Boolean).join(" ") || null

        await db.user.upsert({
          where: { clerkId: data.id as string },
          update: {
            email,
            name,
            avatarUrl: (data.image_url as string) ?? null,
          },
          create: {
            clerkId: data.id as string,
            email,
            name,
            avatarUrl: (data.image_url as string) ?? null,
          },
        })
        break
      }

      case "user.deleted": {
        await db.user
          .delete({ where: { clerkId: data.id as string } })
          .catch(() => {
            // User might not exist in our DB
          })
        break
      }
    }
  } catch (err) {
    console.error(`Error handling Clerk webhook ${type}:`, err)
  }

  return NextResponse.json({ received: true })
}
