import Link from 'next/link'
import { prisma } from '@/lib/db'
import { getStockLevels, getTotals } from '@/lib/stock'

export const dynamic = 'force-dynamic'

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ itemId?: string; locationId?: string }>
}) {
  const { itemId, locationId } = await searchParams

  const [totals, rows, items, locations] = await Promise.all([
    getTotals(),
    getStockLevels({ itemId, locationId }),
    prisma.item.findMany({ orderBy: { name: 'asc' } }),
    prisma.location.findMany({ orderBy: { name: 'asc' } }),
  ])

  const filtered = !!(itemId || locationId)

  return (
    <main className="wrap">
      <h1>Stock on hand</h1>
      <p className="muted">
        Balances are derived live from the movement ledger — where stock is, and
        where it&apos;s being lost.
      </p>

      <div className="stats">
        <div className="stat">
          <span className="num">{totals.items}</span>
          <span className="lbl">items</span>
        </div>
        <div className="stat">
          <span className="num">{totals.locations}</span>
          <span className="lbl">locations</span>
        </div>
        <div className="stat">
          <span className="num">{totals.onHand.toLocaleString()}</span>
          <span className="lbl">units on hand</span>
        </div>
        <div className="stat">
          <span className="num loss">{totals.loss.toLocaleString()}</span>
          <span className="lbl">units lost</span>
        </div>
      </div>

      <div className="card">
        <form className="filters" method="get">
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
            <select
              id="locationId"
              name="locationId"
              defaultValue={locationId ?? ''}
            >
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
            <Link className="btn btn-ghost" href="/">
              Clear
            </Link>
          ) : null}
        </form>

        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Item</th>
                <th>SKU</th>
                <th>Location</th>
                <th className="num">On hand</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={`${r.itemId}|${r.locationId}`}>
                  <td>{r.itemName}</td>
                  <td className="mono">{r.sku}</td>
                  <td>{r.locationName}</td>
                  <td className="num">
                    {r.qty.toLocaleString()} {r.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 ? (
          <p className="muted" style={{ marginTop: '1rem' }}>
            No stock matches this filter.
          </p>
        ) : null}
      </div>
    </main>
  )
}
