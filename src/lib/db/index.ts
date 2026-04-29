import { PrismaClient } from "@prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set")
  }
  const adapter = new PrismaNeon({ connectionString })
  const client = new PrismaClient({
    adapter,
  } as ConstructorParameters<typeof PrismaClient>[0])

  // Surface the full Prisma error code + meta on every failed query. Without
  // this the Vercel log viewer truncates the toString() output to
  // "Error [PrismaClientKnownReq..." which is useless during incidents.
  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          try {
            return await query(args)
          } catch (err) {
            const e = err as {
              name?: string
              message?: string
              code?: string
              meta?: unknown
            }
            console.error(
              `[prisma] ${model}.${operation} failed`,
              JSON.stringify({
                name: e.name,
                code: e.code,
                meta: e.meta,
                message: e.message?.split("\n").slice(0, 4).join(" | "),
                args: JSON.stringify(args).slice(0, 500),
              }),
            )
            throw err
          }
        },
      },
    },
  }) as unknown as PrismaClient
}

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient()
  }
  return globalForPrisma.prisma
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return (getPrisma() as unknown as Record<string | symbol, unknown>)[prop]
  },
})
