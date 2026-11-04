import { Link } from 'react-router-dom'
import { ArrowLeft } from './Icons'

export function BackLink({ to = '/', label = 'Home' }: { to?: string; label?: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium opacity-80 transition hover:bg-black/5 hover:opacity-100"
    >
      <ArrowLeft size={16} /> {label}
    </Link>
  )
}
