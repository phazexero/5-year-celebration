import { splitMs, useNow } from '../lib/time'

type Props = { target: number; compact?: boolean; onDone?: () => void }

export function Countdown({ target, compact }: Props) {
  const now = useNow(1000)
  const { days, hours, minutes, seconds } = splitMs(target - now)
  const units: [number, string][] = [
    [days, 'days'],
    [hours, 'hours'],
    [minutes, 'min'],
    [seconds, 'sec'],
  ]
  return (
    <div className={`flex ${compact ? 'gap-3' : 'gap-4 sm:gap-6'}`} role="timer" aria-live="off">
      {units.map(([v, label]) => (
        <div key={label} className="text-center">
          <div
            className={`font-display tabular-nums leading-none ${compact ? 'text-2xl' : 'text-5xl sm:text-6xl'}`}
          >
            {String(v).padStart(2, '0')}
          </div>
          <div className={`mt-1 uppercase tracking-widest opacity-70 ${compact ? 'text-[10px]' : 'text-xs'}`}>
            {label}
          </div>
        </div>
      ))}
    </div>
  )
}
