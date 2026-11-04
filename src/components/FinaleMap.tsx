import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import { config } from '../content/config'
import { formatDate } from '../lib/time'

const HEART = (color: string, size: number) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" style="filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))"><path fill="${color}" stroke="white" stroke-width="1.5" d="M12 21s-7.5-4.6-9.6-9.3C.9 8.2 3 4.5 6.6 4.5c2.1 0 3.4 1.2 4.1 2.3h2.6c.7-1.1 2-2.3 4.1-2.3 3.6 0 5.7 3.7 4.2 7.2C19.5 16.4 12 21 12 21z"/></svg>`

function heartIcon(color: string, size: number, label?: string) {
  return L.divIcon({
    className: 'heart-marker',
    html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-${size / 2}px)">${HEART(color, size)}${
      label
        ? `<span style="margin-top:2px;padding:2px 8px;border-radius:999px;background:white;font:600 12px 'DM Sans',sans-serif;color:#2d2320;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.2)">${label}</span>`
        : ''
    }</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

export default function FinaleMap({ accent = '#c2410c' }: { accent?: string }) {
  const el = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!el.current) return
    const map = L.map(el.current, { scrollWheelZoom: false, zoomControl: true, attributionControl: true })
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)

    const a = config.myCity
    const b = config.herCity
    L.polyline(
      [
        [a.lat, a.lng],
        [b.lat, b.lng],
      ],
      { color: accent, weight: 3, dashArray: '8 10', opacity: 0.9 },
    ).addTo(map)

    L.marker([a.lat, a.lng], { icon: heartIcon(accent, 34, escapeHtml(`${config.myName} · ${a.name}`)), keyboard: false }).addTo(map)
    L.marker([b.lat, b.lng], { icon: heartIcon(accent, 34, escapeHtml(`${config.herName} · ${b.name}`)), keyboard: false }).addTo(map)

    const points: L.LatLngExpression[] = [
      [a.lat, a.lng],
      [b.lat, b.lng],
    ]
    for (const m of config.meetups ?? []) {
      points.push([m.lat, m.lng])
      L.marker([m.lat, m.lng], { icon: heartIcon('#e11d48', 22), title: m.name })
        .bindPopup(
          `<div style="font-family:'DM Sans',sans-serif"><strong>${escapeHtml(m.name)}</strong><br/>${escapeHtml(
            formatDate(m.date),
          )}${m.note ? `<br/><em>${escapeHtml(m.note)}</em>` : ''}</div>`,
        )
        .addTo(map)
    }
    map.fitBounds(L.latLngBounds(points), { padding: [60, 60], maxZoom: 7 })

    return () => {
      map.remove()
    }
  }, [accent])

  return (
    <div
      ref={el}
      className="h-[460px] w-full overflow-hidden rounded-2xl shadow-[0_24px_60px_-30px_rgb(60_30_20/0.6)] [&_.leaflet-tile-pane]:[filter:sepia(.18)_saturate(.85)]"
      role="region"
      aria-label={`Map showing ${config.myCity.name}, ${config.herCity.name} and the places we met`}
    />
  )
}
