/**
 * ============================================================
 *  EDIT ME: all names, dates, places and personal copy live here.
 *  Anything written in CAPS or marked PLACEHOLDER is meant to be replaced.
 * ============================================================
 */

export type Place = { name: string; lat: number; lng: number }
export type Meetup = Place & { date: string; note?: string }
export type YearTheme = {
  /** page background */
  background: string
  /** buttons, highlights, envelope seal */
  accent: string
  /** main text colour on the background */
  text: string
}
export type YearInfo = { title: string; subtitle: string; theme: YearTheme }

export const config = {
  myName: 'Deb',
  herName: 'Aditi',

  /** IANA timezone used for the day counter and the finale unlock */
  timezone: 'Asia/Kolkata',

  /** the day it all started (YYYY-MM-DD) */
  relationshipStart: '2021-11-10',

  /** finale unlocks at this local time in `timezone` (YYYY-MM-DDTHH:mm) */
  anniversaryUnlock: '2026-11-10T00:00',

  /** cities: name + coordinates (right click a spot on Google Maps to copy lat, lng) */
  myCity: { name: 'Kolkata', lat: 22.5726, lng: 88.3639 } as Place,
  herCity: { name: 'Bengaluru', lat: 12.9716, lng: 77.5946 } as Place,

  /** optional: places you met in person. Delete entries or leave the array empty. */
  meetups: [
    { name: 'PLACEHOLDER first meetup', lat: 19.076, lng: 72.8777, date: '2022-02-14', note: 'PLACEHOLDER note' },
    { name: 'PLACEHOLDER trip', lat: 15.2993, lng: 74.124, date: '2023-12-28', note: 'PLACEHOLDER note' },
  ] as Meetup[],

  /** one entry per year, in order. Colours are any CSS colour. */
  years: [
    {
      title: 'Year 1: The "Hi" That Started It All',
      subtitle: 'Late night texts, college walks, first calls, and not knowing what the future held.',
      theme: { background: '#fbeee6', accent: '#d9485f', text: '#3b1f24' },
    },
    {
      title: 'Year 2: Professional Video Callers through COVID',
      subtitle: 'Frozen screens, dodgy Wi-Fi, and random drama through college.',
      theme: { background: '#eef3e7', accent: '#4f7a3a', text: '#22301b' },
    },
    {
      title: 'Year 3: Frequent Flyer Hearts',
      subtitle: 'Counting down days, hunting cheap tickets for planes and buses, and the best hugs in the country.',
      theme: { background: '#e9f0f7', accent: '#2f6ea5', text: '#14283b' },
    },
    {
      title: 'Year 4: MBA and Chaos',
      subtitle: 'Balancing studies, work, and a relationship across two cities.',
      theme: { background: '#f6efdc', accent: '#c07a12', text: '#3a2a0c' },
    },
    {
      title: 'Year 5: Still Choosing You',
      subtitle: 'Five years, two cities, and still the easiest decision I make every single day.',
      theme: { background: '#f1eaf6', accent: '#7c4dab', text: '#2c1a3d' },
    },
  ] as YearInfo[],

  /** small bits of personal copy used around the app */
  copy: {
    gateTitle: 'Just for you',
    gateHint: 'PLACEHOLDER hint: the password is something only we would know',
    gateWrong: 'Not quite. Try again?',
    homeTagline: 'Five years, two cities, one us.',
    distanceLine: 'apart on the map, never apart where it counts',
    finaleCardTitle: 'Year 5 and beyond',
    finaleLockedLine: 'This one opens on our anniversary. Patience, love.',
    finaleIntro: 'PLACEHOLDER: a line that introduces the map, e.g. "Every line on this map ends with you."',
    finaleOutro: 'Happy five years. Here is to forever.',
    playTitle: 'Play together',
    playSubtitle: 'Two little games for two laptops in two cities.',
    matchWinCompetitive: 'You can have the trophy today, since I already got the ultimate prize.',
    matchWinCoop: 'One game down, a lifetime of turns left with you',
    quizEnd: 'Every question was just an excuse to look back at how lucky I am to have you',
  },

  /**
   * Playful titles for the quiz winner screen, picked by how many points
   * a player scored as a share of rounds played (highest threshold first).
   */
  quizTitles: [
    { min: 0.8, title: 'Certified Mind Reader' },
    { min: 0.6, title: 'Professional Partner' },
    { min: 0.4, title: 'Lovably Clueless' },
    { min: 0, title: 'Needs More Date Nights' },
  ],
}

export type Role = 'me' | 'her'
export const nameOf = (role: Role) => (role === 'me' ? config.myName : config.herName)
export const otherRole = (role: Role): Role => (role === 'me' ? 'her' : 'me')
