import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const tursoUrl = process.env.TURSO_URL
  const authToken = process.env.TURSO_AUTH_TOKEN

  if (tursoUrl && authToken) {
    // Turso (libSQL) connection for Vercel / production
    const libsql = createClient({
      url: tursoUrl,
      authToken,
    })

    const adapter = new PrismaLibSql(libsql)
    return new PrismaClient({ adapter })
  }

  // Local SQLite fallback (dev)
  return new PrismaClient()
}

export const db =
  globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
