import Link from 'next/link'
import { prisma } from '@/lib/db'
import { MOVEMENT_TYPES, isMovementType } from '@/lib/stock'

export const dynamic = 'force-dynamic'

export default async function Movements({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; itemId?: string; locationId?: string }>
}) {
  const { type, itemId, locationId } = await searchParams
  const typeFilter = type && isMovementType(type) ? type : undefined

  const [movements, items, locations] = await Promise.all([
    prisma.stockMovement.findMany({
      where: {
        type: typeFilter,
        itemId: itemId || undefined,
        ...(locationId
          ? { OR: [{ fromLocationId: locationId }, { toLocationId: locationId }] }
          : {}),
      },
      include: { item: true, fromLocation: true, toLocation: true, supplier: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    prisma.item.findMany({ orderBy: { name: 'asc' } }),
    prisma.location.findMany({ orderBy: { name: 'asc' } }),
  ])

  const filtered = !!(typeFilter || itemId || locationId)

  return (
    <main className="wrap">
      <h1>Movement ledger</h1>
      <p className="muted">Every purchase, transfer, and loss, newest first.</p>

      <div className="card">
        <form className="filters" method="get">
          <div className="field">
            <label htmlFor="type">Type</label>
            <select id="type" name="type" defaultValue={typeFilter ?? ''}>
              <option value="">All types</option>
              {MOVEMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="itemId">Item</label>
            <select id="itemId" name="itemId" defaultValue={itemId ?? ''}>
              <option value="">All items</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="locationId">Location</label>
            <select id="locationId" name="locationId" defaultValue={locationId ?? ''}>
              <option value="">All locations</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <button className="btn" type="submit">
            Filter
          </button>
          {filtered ? (
            <Link className="btn btn-ghost" href="/movements">
              Clear
            </Link>
          ) : null}
        </form>

        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>When</th>
                <th>Type</th>
                <th>Item</th>
                <th className="num">Qty</th>
                <th>From → To</th>
                <th>Supplier</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id}>
                  <td className="mono">{m.createdAt.toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${m.type}`}>{m.type}</span>
                  </td>
                  <td>{m.item.name}</td>
                  <td className="num">
                    {m.quantity} {m.item.unit}
                  </td>
                  <td>
                    {m.fromLocation?.name ?? '—'} → {m.toLocation?.name ?? '—'}
                  </td>
                  <td>{m.supplier?.name ?? '—'}</td>
                  <td className="muted small">{m.note ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {movements.length === 0 ? (
          <p className="muted" style={{ marginTop: '1rem' }}>
            No movements match this filter.
          </p>
        ) : null}
      </div>
    </main>
  )
}
