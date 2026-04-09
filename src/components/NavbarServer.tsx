import { createClient } from '@/lib/supabase/server'
import NavbarUI from './Navbar'

export default async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return <NavbarUI isLoggedIn={!!user} />
}
