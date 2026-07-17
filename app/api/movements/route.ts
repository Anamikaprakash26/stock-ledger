import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { isMovementType } from '@/lib/stock'

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const type = String(form.get('type') ?? '')
  const itemId = String(form.get('itemId') ?? '')
  const quantity = Number(form.get('quantity') ?? 0)
  const fromLocationId = String(form.get('fromLocationId') ?? '') || null
  const toLocationId = String(form.get('toLocationId') ?? '') || null
  const supplierId = String(form.get('supplierId') ?? '') || null
  const note = String(form.get('note') ?? '').trim().slice(0, 200) || null

  const fail = (msg: string) =>
    NextResponse.redirect(new URL(`/new?error=${encodeURIComponent(msg)}`, req.url), 303)

  if (!isMovementType(type)) return fail('invalid type')
  if (!itemId) return fail('item required')
  if (!Number.isInteger(quantity) || quantity <= 0) return fail('quantity must be a positive whole number')

  // Enforce the location shape for each movement type.
  if (type === 'PURCHASE' && !toLocationId) return fail('purchase needs a destination location')
  if (type === 'TRANSFER' && (!fromLocationId || !toLocationId)) return fail('transfer needs both locations')
  if (type === 'TRANSFER' && fromLocationId === toLocationId) return fail('transfer locations must differ')
  if (type === 'LOSS' && !fromLocationId) return fail('loss needs a source location')

  await prisma.stockMovement.create({
    data: {
      type,
      itemId,
      quantity,
      // Only persist the locations relevant to this type.
      fromLocationId: type === 'PURCHASE' ? null : fromLocationId,
      toLocationId: type === 'LOSS' ? null : toLocationId,
      supplierId: type === 'PURCHASE' ? supplierId : null,
      note,
    },
  })

  return NextResponse.redirect(new URL('/', req.url), 303)
}
