'use client'

import { useState } from 'react'
import { MOVEMENT_TYPES, type MovementType } from '@/lib/stock'

type Opt = { id: string; name: string }

export default function RecordForm({
  items,
  locations,
  suppliers,
}: {
  items: Opt[]
  locations: Opt[]
  suppliers: Opt[]
}) {
  const [type, setType] = useState<MovementType>('PURCHASE')

  const needsFrom = type === 'TRANSFER' || type === 'LOSS'
  const needsTo = type === 'PURCHASE' || type === 'TRANSFER'
  const needsSupplier = type === 'PURCHASE'

  return (
    <form className="form-grid" method="post" action="/api/movements">
      <div className="field">
        <label htmlFor="type">Movement type</label>
        <select
          id="type"
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as MovementType)}
        >
          {MOVEMENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <span className="hint">
          {type === 'PURCHASE'
            ? 'Stock coming in from a supplier into a location.'
            : type === 'TRANSFER'
              ? 'Moving stock from one location to another.'
              : 'Stock lost at a location (shrinkage, waste, clipping).'}
        </span>
      </div>

      <div className="field">
        <label htmlFor="itemId">Item</label>
        <select id="itemId" name="itemId" required>
          {items.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="quantity">Quantity</label>
        <input id="quantity" name="quantity" type="number" min={1} required />
      </div>

      {needsFrom ? (
        <div className="field">
          <label htmlFor="fromLocationId">From location</label>
          <select id="fromLocationId" name="fromLocationId" required>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {needsTo ? (
        <div className="field">
          <label htmlFor="toLocationId">To location</label>
          <select id="toLocationId" name="toLocationId" required>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {needsSupplier ? (
        <div className="field">
          <label htmlFor="supplierId">Supplier</label>
          <select id="supplierId" name="supplierId">
            <option value="">—</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="field">
        <label htmlFor="note">Note (optional)</label>
        <textarea id="note" name="note" rows={2} maxLength={200} />
      </div>

      <button className="btn" type="submit" style={{ justifySelf: 'start' }}>
        Record movement
      </button>
    </form>
  )
}
