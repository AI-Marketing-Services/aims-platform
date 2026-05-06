import { CalendarDays } from "lucide-react"
import { db } from "@/lib/db"
import { ensureDbUser } from "@/lib/auth/ensure-user"
import { defaultWeeklyHours } from "@/lib/booking/slots"
import { BookingPageClient } from "./BookingPageClient"

export const metadata = { title: "Booking Page" }
export const dynamic = "force-dynamic"

export default async function BookingAdminPage() {
  const dbUser = await ensureDbUser()

  const [availability, upcoming] = await Promise.all([
    db.bookingAvailability.findUnique({ where: { userId: dbUser.id } }),
    db.booking.findMany({
      where: { userId: dbUser.id, startAt: { gte: new Date() } },
      orderBy: { startAt: "asc" },
      take: 25,
    }),
  ])

  // Default suggested handle = first 20 chars of name, slugified.
  const suggestedHandle = (dbUser.name ?? "you")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 20)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <CalendarDays className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Booking Page</h1>
          <p className="text-sm text-muted-foreground">
            Branded scheduler — every booking auto-creates a CRM deal.
          </p>
        </div>
      </div>

      <BookingPageClient
        suggestedHandle={suggestedHandle}
        defaultWeeklyHours={defaultWeeklyHours()}
        initialAvailability={
          availability
            ? {
                handle: availability.handle,
                isActive: availability.isActive,
                durationMinutes: availability.durationMinutes,
                bufferMinutes: availability.bufferMinutes,
                timezone: availability.timezone,
                weeklyHours: availability.weeklyHours as Record<
                  string,
                  Array<{ start: string; end: string }>
                >,
                welcomeTitle: availability.welcomeTitle ?? "",
                welcomeBody: availability.welcomeBody ?? "",
              }
            : null
        }
        upcomingBookings={upcoming.map((b) => ({
          id: b.id,
          inviteeName: b.inviteeName,
          inviteeEmail: b.inviteeEmail,
          startAt: b.startAt.toISOString(),
          endAt: b.endAt.toISOString(),
          notes: b.notes,
        }))}
      />
    </div>
  )
}
