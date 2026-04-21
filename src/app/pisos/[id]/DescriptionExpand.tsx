'use client'

import { useState } from 'react'

const LIMIT = 700

export default function DescriptionExpand({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = text.length > LIMIT

  return (
    <div>
      <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm">
        {isLong && !expanded ? text.slice(0, LIMIT) + '…' : text}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-sm font-medium text-[#c9962a] hover:text-[#a87a20] transition-colors"
        >
          {expanded ? 'Leer menos ↑' : 'Leer más →'}
        </button>
      )}
    </div>
  )
}
