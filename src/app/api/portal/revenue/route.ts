import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

export const dynamic = "force-dynamic"

// Pipeline stages (not yet closed)
const PIPELINE_STAGES = ["PROSPECT", "DISCOVERY_CALL", "PROPOSAL_SENT"] as const

// Active / closed-won stages
const ACTIVE_STAGES = ["ACTIVE_RETAINER", "COMPLETED"] as const

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function startOfPrevMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1)
}

function endOfPrevMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 0, 23, 59, 59, 999)
}

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d
}

function shortMonth(date: Date): string {
  return date.toLocaleString("en-US", { month: "short" })
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const dbUser = await db.user.findUnique({ where: { clerkId: userId }, select: { id: true } })
  if (!dbUser) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const now = new Date()
  const thisMonthStart = startOfMonth(now)
  const prevMonthStart = startOfPrevMonth(now)
  const prevMonthEnd = endOfPrevMonth(now)
  const ninetyDaysAgo = daysAgo(90)

  try {
    // Run all independent queries in parallel
    const [
      allDeals,
      allInvoices,
      prevMonthActiveDeals,
    ] = await Promise.all([
      // All deals for this user (we'll compute everything from them client-side to avoid N+1)
      db.clientDeal.findMany({
        where: { userId: dbUser.id },
        select: {
          id: true,
          companyName: true,
          stage: true,
          value: true,
          wonAt: true,
          lostAt: true,
          createdAt: true,
        },
      }),

      // All invoices for this user
      db.clientInvoice.findMany({
        where: { userId: dbUser.id },
        select: {
          total: true,
          status: true,
          paidAt: true,
          createdAt: true,
        },
      }),

      // Previous month active deals (for MRR change comparison)
      db.clientDeal.findMany({
        where: {
          userId: dbUser.id,
          stage: { in: ["ACTIVE_RETAINER", "COMPLETED"] },
          createdAt: { gte: prevMonthStart, lte: prevMonthEnd },
        },
        select: { value: true },
      }),
    ])

    // ── MRR ──────────────────────────────────────────────────────────────────
    const activeDealsThisMonth = allDeals.filter(
      (d) =>
        ACTIVE_STAGES.includes(d.stage as typeof ACTIVE_STAGES[number]) &&
        d.createdAt >= thisMonthStart,
    )
    const mrr = activeDealsThisMonth.reduce((s, d) => s + d.value, 0)
    const prevMrr = prevMonthActiveDeals.reduce((s, d) => s + d.value, 0)
    const mrrChange = prevMrr === 0
      ? (mrr > 0 ? 100 : 0)
      : Math.round(((mrr - prevMrr) / prevMrr) * 100 * 10) / 10

    // ── Pipeline ─────────────────────────────────────────────────────────────
    const pipelineDeals = allDeals.filter((d) =>
      PIPELINE_STAGES.includes(d.stage as typeof PIPELINE_STAGES[number]),
    )
    const pipelineValue = pipelineDeals.reduce((s, d) => s + d.value, 0)
    const pipelineCount = pipelineDeals.length

    // ── Won / Lost this month ─────────────────────────────────────────────────
    const wonThisMonthDeals = allDeals.filter(
      (d) =>
        ACTIVE_STAGES.includes(d.stage as typeof ACTIVE_STAGES[number]) &&
        d.wonAt !== null &&
        d.wonAt >= thisMonthStart,
    )
    const wonThisMonth = wonThisMonthDeals.reduce((s, d) => s + d.value, 0)
    const wonCountThisMonth = wonThisMonthDeals.length

    const lostThisMonthDeals = allDeals.filter(
      (d) => d.stage === "LOST" && d.lostAt !== null && d.lostAt >= thisMonthStart,
    )
    const lostThisMonth = lostThisMonthDeals.reduce((s, d) => s + d.value, 0)
    const lostCountThisMonth = lostThisMonthDeals.length

    // ── Close rate (last 90 days) ─────────────────────────────────────────────
    const recentWon = allDeals.filter(
      (d) =>
        ACTIVE_STAGES.includes(d.stage as typeof ACTIVE_STAGES[number]) &&
        d.wonAt !== null &&
        d.wonAt >= ninetyDaysAgo,
    ).length
    const recentLost = allDeals.filter(
      (d) => d.stage === "LOST" && d.lostAt !== null && d.lostAt >= ninetyDaysAgo,
    ).length
    const closeRate =
      recentWon + recentLost === 0
        ? 0
        : Math.round((recentWon / (recentWon + recentLost)) * 100)

    // ── Avg deal size (won last 90 days) ─────────────────────────────────────
    const recentWonDeals = allDeals.filter(
      (d) =>
        ACTIVE_STAGES.includes(d.stage as typeof ACTIVE_STAGES[number]) &&
        d.wonAt !== null &&
        d.wonAt >= ninetyDaysAgo,
    )
    const avgDealSize =
      recentWonDeals.length === 0
        ? 0
        : Math.round(recentWonDeals.reduce((s, d) => s + d.value, 0) / recentWonDeals.length)

    // ── Invoice stats ─────────────────────────────────────────────────────────
    const invoiceOutstanding = allInvoices
      .filter((i) => i.status === "SENT" || i.status === "OVERDUE")
      .reduce((s, i) => s + i.total, 0)

    const invoiceCollected = allInvoices
      .filter((i) => i.status === "PAID")
      .reduce((s, i) => s + i.total, 0)

    const invoiceCollectedThisMonth = allInvoices
      .filter((i) => i.status === "PAID" && i.paidAt !== null && i.paidAt >= thisMonthStart)
      .reduce((s, i) => s + i.total, 0)

    const overdueCount = allInvoices.filter((i) => i.status === "OVERDUE").length

    // ── Pipeline by stage ─────────────────────────────────────────────────────
    const stageOrder = ["PROSPECT", "DISCOVERY_CALL", "PROPOSAL_SENT", "ACTIVE_RETAINER", "COMPLETED"]
    const stageMap = new Map<string, { count: number; value: number }>()
    for (const stage of stageOrder) {
      stageMap.set(stage, { count: 0, value: 0 })
    }
    for (const deal of allDeals.filter((d) => d.stage !== "LOST")) {
      const entry = stageMap.get(deal.stage)
      if (entry) {
        stageMap.set(deal.stage, { count: entry.count + 1, value: entry.value + deal.value })
      }
    }
    const pipelineByStage = stageOrder.map((stage) => ({
      stage,
      ...stageMap.get(stage)!,
    }))

    // ── Monthly trend (last 6 months) ─────────────────────────────────────────
    const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1)
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)

      const collected = allInvoices
        .filter(
          (inv) =>
            inv.status === "PAID" &&
            inv.paidAt !== null &&
            inv.paidAt >= monthStart &&
            inv.paidAt <= monthEnd,
        )
        .reduce((s, inv) => s + inv.total, 0)

      const pipeline = allDeals
        .filter(
          (deal) =>
            PIPELINE_STAGES.includes(deal.stage as typeof PIPELINE_STAGES[number]) &&
            deal.createdAt >= monthStart &&
            deal.createdAt <= monthEnd,
        )
        .reduce((s, deal) => s + deal.value, 0)

      return { month: shortMonth(d), collected, pipeline }
    })

    // ── Top deals ─────────────────────────────────────────────────────────────
    const topDeals = allDeals
      .filter((d) => d.stage !== "LOST")
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map((d) => ({
        id: d.id,
        companyName: d.companyName,
        stage: d.stage,
        value: d.value,
        daysOpen: Math.floor((now.getTime() - d.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
      }))

    return NextResponse.json({
      mrr,
      mrrChange,
      pipelineValue,
      pipelineCount,
      wonThisMonth,
      wonCountThisMonth,
      lostThisMonth,
      lostCountThisMonth,
      closeRate,
      avgDealSize,
      invoiceOutstanding,
      invoiceCollected,
      invoiceCollectedThisMonth,
      overdueCount,
      pipelineByStage,
      monthlyTrend,
      topDeals,
    })
  } catch (err) {
    logger.error("Failed to compute revenue metrics", err, { userId })
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
