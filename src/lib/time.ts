import { useEffect, useState } from 'react'
import { config } from '../content/config'

/** milliseconds the given timezone is ahead of UTC at instant `utcMs` */
function tzOffsetMs(utcMs: number, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const p: Record<string, number> = {}
  for (const part of dtf.formatToParts(new Date(utcMs))) {
    if (part.type !== 'literal') p[part.type] = Number(part.value)
  }
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return asUtc - Math.floor(utcMs / 1000) * 1000
}

/** "2026-11-10T00:00" wall clock time in `timeZone` -> UTC epoch ms */
export function zonedToUtc(local: string, timeZone: string): number {
  const [datePart, timePart = '00:00'] = local.split('T')
  const [y, m, d] = datePart.split('-').map(Number)
  const [hh = 0, mm = 0, ss = 0] = timePart.split(':').map(Number)
  const guess = Date.UTC(y, m - 1, d, hh, mm, ss)
  const first = guess - tzOffsetMs(guess, timeZone)
  // second pass corrects for a DST change between the guess and the real instant
  return guess - tzOffsetMs(first, timeZone)
}

export const unlockAt = zonedToUtc(config.anniversaryUnlock, config.timezone)
export const startAt = zonedToUtc(`${config.relationshipStart}T00:00`, config.timezone)

/** current time, re-rendering every `intervalMs` */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}

export type Parts = { days: number; hours: number; minutes: number; seconds: number }

export function splitMs(ms: number): Parts {
  const total = Math.max(0, Math.floor(ms / 1000))
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  }
}

const PREVIEW_KEY = 'anniv-preview'

/** true when ?preview=1 is in the URL (remembered for this browser tab) */
export function isPreview(): boolean {
  try {
    const q = new URLSearchParams(window.location.search).get('preview')
    if (q === '1') sessionStorage.setItem(PREVIEW_KEY, '1')
    if (q === '0') sessionStorage.removeItem(PREVIEW_KEY)
    return sessionStorage.getItem(PREVIEW_KEY) === '1'
  } catch {
    return new URLSearchParams(window.location.search).get('preview') === '1'
  }
}

export function isUnlocked(now: number): boolean {
  return now >= unlockAt || isPreview()
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "2022-02-14" -> "14 Feb 2022"; anything else is shown as typed */
export function formatDate(s: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s ?? '')
  if (!m) return s
  const month = MONTHS[Number(m[2]) - 1]
  return month ? `${Number(m[3])} ${month} ${m[1]}` : s
}

export const isRealDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s ?? '')
