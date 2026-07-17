import { prisma } from './db'

export type MovementType = 'PURCHASE' | 'TRANSFER' | 'LOSS'
export const MOVEMENT_TYPES: MovementType[] = ['PURCHASE', 'TRANSFER', 'LOSS']

export function isMovementType(v: string): v is MovementType {
  return (MOVEMENT_TYPES as string[]).includes(v)
}

export type StockRow = {
  itemId: string
  itemName: string
  sku: string
  unit: string
  locationId: string
  locationName: string
  qty: number
}

/**
 * Derive on-hand per (item, location) from the movement ledger — balances are
 * computed, never stored, so history and totals can't drift apart.
 */
export async function getStockLevels(
  filter: { itemId?: string; locationId?: string } = {},
): Promise<StockRow[]> {
  const movements = await prisma.stockMovement.findMany({
    where: { itemId: filter.itemId || undefined },
    include: { item: true, fromLocation: true, toLocation: true },
  })

  const balances = new Map<string, StockRow>()
  const apply = (
    item: { id: string; name: string; sku: string; unit: string },
    loc: { id: string; name: string } | null,
    delta: number,
  ) => {
    if (!loc) return
    const key = `${item.id}|${loc.id}`
    const row =
      balances.get(key) ??
      {
        itemId: item.id,
        itemName: item.name,
        sku: item.sku,
        unit: item.unit,
        locationId: loc.id,
        locationName: loc.name,
        qty: 0,
      }
    row.qty += delta
    balances.set(key, row)
  }

  for (const m of movements) {
    if (m.type === 'PURCHASE') apply(m.item, m.toLocation, m.quantity)
    else if (m.type === 'TRANSFER') {
      apply(m.item, m.fromLocation, -m.quantity)
      apply(m.item, m.toLocation, m.quantity)
    } else if (m.type === 'LOSS') apply(m.item, m.fromLocation, -m.quantity)
  }

  let rows = [...balances.values()].filter((r) => r.qty !== 0)
  if (filter.locationId) rows = rows.filter((r) => r.locationId === filter.locationId)
  rows.sort(
    (a, b) =>
      a.locationName.localeCompare(b.locationName) ||
      a.itemName.localeCompare(b.itemName),
  )
  return rows
}

/** Headline numbers for the dashboard. Transfers net to zero for total on-hand. */
export async function getTotals() {
  const [items, locations, movements] = await Promise.all([
    prisma.item.count(),
    prisma.location.count(),
    prisma.stockMovement.findMany(),
  ])
  let onHand = 0
  let loss = 0
  for (const m of movements) {
    if (m.type === 'PURCHASE') onHand += m.quantity
    else if (m.type === 'LOSS') {
      onHand -= m.quantity
      loss += m.quantity
    }
  }
  return { items, locations, onHand, loss, movements: movements.length }
}
