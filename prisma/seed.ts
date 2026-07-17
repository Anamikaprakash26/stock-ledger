import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000)

async function main() {
  // Clean slate — idempotent re-seed.
  await prisma.stockMovement.deleteMany()
  await prisma.item.deleteMany()
  await prisma.location.deleteMany()
  await prisma.supplier.deleteMany()

  const items = await Promise.all(
    [
      { sku: 'CW-01', name: 'Copper Wire', unit: 'kg' },
      { sku: 'SB-02', name: 'Steel Bolts', unit: 'boxes' },
      { sku: 'CB-03', name: 'Cotton Bales', unit: 'bales' },
      { sku: 'CT-04', name: 'Ceramic Tiles', unit: 'pallets' },
    ].map((data) => prisma.item.create({ data })),
  )

  const locations = await Promise.all(
    [
      { code: 'WH1', name: 'Central Warehouse' },
      { code: 'DP2', name: 'North Depot' },
      { code: 'PS3', name: 'Port Store' },
    ].map((data) => prisma.location.create({ data })),
  )

  const suppliers = await Promise.all(
    [
      { code: 'ACM', name: 'Acme Supplies' },
      { code: 'GLM', name: 'Global Metals' },
      { code: 'BTX', name: 'BlueTex Traders' },
    ].map((data) => prisma.supplier.create({ data })),
  )

  const item = (sku: string) => items.find((i) => i.sku === sku)!
  const loc = (code: string) => locations.find((l) => l.code === code)!
  const sup = (code: string) => suppliers.find((s) => s.code === code)!

  // A small but realistic ledger: purchases in, transfers out to depots/port,
  // and a few losses — so the dashboard shows real balances and shrinkage.
  const ledger: {
    type: string
    sku: string
    qty: number
    from?: string
    to?: string
    supplier?: string
    note?: string
    days: number
  }[] = [
    { type: 'PURCHASE', sku: 'CW-01', qty: 900, to: 'WH1', supplier: 'GLM', days: 14 },
    { type: 'PURCHASE', sku: 'SB-02', qty: 500, to: 'WH1', supplier: 'ACM', days: 14 },
    { type: 'PURCHASE', sku: 'CB-03', qty: 220, to: 'WH1', supplier: 'BTX', days: 12 },
    { type: 'PURCHASE', sku: 'CT-04', qty: 140, to: 'WH1', supplier: 'ACM', days: 12 },

    { type: 'TRANSFER', sku: 'CW-01', qty: 300, from: 'WH1', to: 'DP2', days: 9 },
    { type: 'TRANSFER', sku: 'SB-02', qty: 180, from: 'WH1', to: 'PS3', days: 9 },
    { type: 'TRANSFER', sku: 'CB-03', qty: 90, from: 'WH1', to: 'DP2', days: 7 },
    { type: 'TRANSFER', sku: 'CW-01', qty: 120, from: 'DP2', to: 'PS3', days: 5 },

    { type: 'LOSS', sku: 'CW-01', qty: 25, from: 'DP2', note: 'oxidation / offcuts', days: 4 },
    { type: 'LOSS', sku: 'CB-03', qty: 8, from: 'DP2', note: 'damp damage', days: 3 },
    { type: 'LOSS', sku: 'CT-04', qty: 6, from: 'WH1', note: 'breakage in handling', days: 2 },

    { type: 'PURCHASE', sku: 'SB-02', qty: 260, to: 'WH1', supplier: 'ACM', days: 1 },
  ]

  for (const m of ledger) {
    await prisma.stockMovement.create({
      data: {
        type: m.type,
        itemId: item(m.sku).id,
        quantity: m.qty,
        fromLocationId: m.from ? loc(m.from).id : null,
        toLocationId: m.to ? loc(m.to).id : null,
        supplierId: m.supplier ? sup(m.supplier).id : null,
        note: m.note ?? null,
        createdAt: daysAgo(m.days),
      },
    })
  }

  console.log('Seeded stock-ledger ✓')
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
