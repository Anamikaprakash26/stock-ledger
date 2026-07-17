import { prisma } from '@/lib/db'
import RecordForm from './record-form'

export const dynamic = 'force-dynamic'

export default async function NewMovement() {
  const [items, locations, suppliers] = await Promise.all([
    prisma.item.findMany({ orderBy: { name: 'asc' } }),
    prisma.location.findMany({ orderBy: { name: 'asc' } }),
    prisma.supplier.findMany({ orderBy: { name: 'asc' } }),
  ])

  return (
    <main className="wrap">
      <h1>Record a movement</h1>
      <p className="muted">
        Add a purchase, transfer, or loss. Stock balances update automatically.
      </p>
      <div className="card">
        <RecordForm items={items} locations={locations} suppliers={suppliers} />
      </div>
    </main>
  )
}
