
'use client'
//import Button from '@/components/ui/Button'
import { logout } from '@/lib/actions';

export default function Home() {
  return <button onClick={() => logout()}>Sign out</button>
}
