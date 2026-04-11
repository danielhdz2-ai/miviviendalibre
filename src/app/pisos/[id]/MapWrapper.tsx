'use client'

import dynamic from 'next/dynamic'

const ListingMap = dynamic(() => import('@/components/ListingMap'), { ssr: false })

interface Props {
  lat: number
  lng: number
  title: string
  price?: string
  zoom?: number
  circleRadius?: number
}

export default function MapWrapper(props: Props) {
  return <ListingMap {...props} />
}
