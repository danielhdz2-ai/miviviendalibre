export type ListingOrigin = 'external' | 'direct'
export type ListingStatus = 'draft' | 'published' | 'paused' | 'archived'
export type OperationType = 'sale' | 'rent'

export interface ListingImage {
  id: string
  listing_id: string
  storage_path: string | null
  external_url: string | null
  position: number
  created_at: string
}

export interface Listing {
  id: string
  origin: ListingOrigin
  owner_user_id: string | null
  operation: OperationType
  title: string
  description: string | null
  price_eur: number | null
  province: string | null
  city: string | null
  district: string | null
  postal_code: string | null
  lat: number | null
  lng: number | null
  bedrooms: number | null
  bathrooms: number | null
  area_m2: number | null
  source_portal: string | null
  source_url: string | null
  source_external_id: string | null
  is_particular: boolean | null
  particular_confidence: number | null
  ranking_score: number
  turbo_until: string | null
  status: ListingStatus
  views_count: number
  published_at: string | null
  created_at: string
  updated_at: string
  features: Record<string, string> | null
  is_bank: boolean | null
  bank_entity: string | null
  external_link: string | null
  phone: string | null
  listing_images?: ListingImage[]
}

export type SortOption = 'relevancia' | 'precio_asc' | 'precio_desc' | 'recientes' | 'superficie'
export type VistaOption = 'grid' | 'lista' | 'mapa'

export interface SearchParams {
  ciudad?: string
  operacion?: OperationType
  solo_particulares?: boolean
  solo_bancarias?: boolean
  habitaciones?: number
  habitaciones_min?: number
  banos_min?: number
  precio_min?: number
  precio_max?: number
  area_min?: number
  area_max?: number
  ordenar?: SortOption
  vista?: VistaOption
  pagina?: number
}

export type DetectParticularResult = {
  is_particular: boolean
  confidence: number
  matched_keywords: string[]
}
