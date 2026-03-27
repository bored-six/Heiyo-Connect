import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import * as dotenv from "dotenv"

dotenv.config({ path: ".env" })

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const users = await prisma.user.findMany({
    where: { tenantId: { not: null } },
    select: { id: true, tenantId: true, role: true },
  })

  console.log(`Found ${users.length} users to backfill`)

  for (const u of users) {
    if (!u.tenantId) continue
    await prisma.tenantMembership.upsert({
      where: { userId_tenantId: { userId: u.id, tenantId: u.tenantId } },
      create: { userId: u.id, tenantId: u.tenantId, role: u.role ?? "AGENT" },
      update: {},
    })
    console.log(`  ✓ ${u.id} → tenant ${u.tenantId} (${u.role})`)
  }

  console.log("Backfill complete.")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
