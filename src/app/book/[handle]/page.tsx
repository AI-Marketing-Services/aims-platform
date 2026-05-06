import { notFound } from "next/navigation"
import { CalendarDays } from "lucide-react"
import { db } from "@/lib/db"
import { PublicBookingClient } from "./PublicBookingClient"

export const dynamic = "force-dynamic"

export default async function PublicBookingPage({
  params,
}: {
  params: Promise<{ handle: string }>
}) {
  const { handle } = await params

  const availability = await db.bookingAvailability.findUnique({
    where: { handle: handle.toLowerCase() },
    include: {
      user: {
        select: {
          name: true,
          memberProfile: {
            select: {
              businessName: true,
              brandColor: true,
              logoUrl: true,
            },
          },
        },
      },
    },
  })
  if (!availability || !availability.isActive) notFound()

  const operatorName =
    availability.user.memberProfile?.businessName ?? availability.user.name ?? "Book a call"
  const brandColor = availability.user.memberProfile?.brandColor ?? null
  const logoUrl = availability.user.memberProfile?.logoUrl ?? null

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-6">
          {logoUrl ? (
            // User-uploaded logos can come from arbitrary domains
            // (Vercel Blob, Cloudinary, etc.) — using <img> instead of
            // next/image avoids domain whitelist friction.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={operatorName}
              className="mx-auto h-12 mb-3 object-contain"
            />
          ) : (
            <div
              className="mx-auto h-12 w-12 rounded-xl flex items-center justify-center mb-3"
              style={
                brandColor
                  ? { backgroundColor: `${brandColor}20`, color: brandColor }
                  : undefined
              }
            >
              <CalendarDays
                className="h-6 w-6"
                style={brandColor ? { color: brandColor } : undefined}
              />
            </div>
          )}
          <h1 className="text-2xl font-bold text-foreground">
            {availability.welcomeTitle ?? `Book time with ${operatorName}`}
          </h1>
          {availability.welcomeBody && (
            <p className="text-sm text-muted-foreground max-w-xl mx-auto mt-2 whitespace-pre-wrap">
              {availability.welcomeBody}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-3">
            {availability.durationMinutes} min · {availability.timezone}
          </p>
        </div>

        <PublicBookingClient
          handle={availability.handle}
          durationMinutes={availability.durationMinutes}
          brandColor={brandColor}
        />
      </div>
    </div>
  )
}
