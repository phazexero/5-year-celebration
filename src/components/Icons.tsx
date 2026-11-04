import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement> & { size?: number }
const base = (size = 20): SVGProps<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
})

export const Heart = ({ size, filled = true, ...p }: P & { filled?: boolean }) => (
  <svg {...base(size)} {...p} fill={filled ? 'currentColor' : 'none'}>
    <path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.2 3 4.5 6.6 4.5c2.1 0 3.4 1.2 4.1 2.3h2.6c.7-1.1 2-2.3 4.1-2.3 3.6 0 5.7 3.7 4.2 7.2C19.5 16.4 12 21 12 21z" />
  </svg>
)
export const Lock = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
)
export const ArrowLeft = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)
export const ArrowRight = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
)
export const Close = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
)
export const MapPin = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
)
export const Music = ({ size, off, ...p }: P & { off?: boolean }) => (
  <svg {...base(size)} {...p}>
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
    {off && <path d="M2 2l20 20" />}
  </svg>
)
export const Gamepad = ({ size, ...p }: P) => (
  <svg {...base(size)} {...p}>
    <rect x="2" y="7" width="20" height="11" rx="5" />
    <path d="M7 11v3M5.5 12.5h3M15.5 12h.01M18 14h.01" />
  </svg>
)
