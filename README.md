# Five Years: anniversary web app

A private little site for our 5 year anniversary: a gallery of five chapters with letters, a finale that unlocks on **10 November 2026**, and two realtime games for two laptops in two cities.

Built with Vite, React, TypeScript, Tailwind CSS v4, `motion`, Leaflet with OpenStreetMap, and Firebase Realtime Database with Anonymous Auth. Hosting is Vercel Hobby, so the total cost is $0.

---

## Quick start (local)

```bash
npm install
npm run dev            # http://localhost:5173
```

Without a `.env.local` the dev server still runs: the password is `letmein`, and the gallery shows themed placeholder tiles instead of photos. The games need Firebase (see below) or the local emulator.

```bash
npm run build          # type check and production build into dist/
npm run preview        # serve the production build locally
```

---

## Editing the content

Everything personal lives in `src/content/`. You never need to touch a component.

| File | What it holds |
| --- | --- |
| `config.ts` | names, start date, unlock time and timezone, both cities (lat/lng), meetups for the map, the 5 year titles, subtitles and colours, and small bits of copy (gate hint, tagline, end of game messages, quiz titles) |
| `memories.json` | optional photos shipped as files: `file`, `date` (`YYYY-MM-DD`), `place`, `caption`. Most photos are easier to add from the website |
| `letters.ts` | one letter per year and the final anniversary letter. Separate paragraphs with a blank line |
| `quiz.json` | quiz questions. `about` is `"me"` or `"her"`; add `options` for multiple choice, leave it out for free text. `roundsPerGame` sets the number of rounds |

Search the project for `PLACEHOLDER` and `HER_NAME` to find everything that still needs replacing.

To get coordinates for a city or meetup, right click the spot in Google Maps and click the numbers at the top of the menu to copy `lat, lng`.

### Photos

There are two ways to add photos, and they can be mixed.

**From the website (easiest).** Open any year, press **Add photos**, pick up to 20 at a time, give each a caption, date and place, and upload. Anyone who knows the site password can add, edit or delete photos, so Aditi can add hers too. Photos appear instantly for both of you, in the year wall, the chapter cover on the home page and the Memory Match deck.

How it stays free: Firebase Storage needs a billing account, so each photo is shrunk in the browser (1400px long edge, WebP, roughly 150 to 400 KB) and saved in the Realtime Database. The free plan's storage and monthly download allowance comfortably cover a few hundred photos viewed by two people; you can watch usage in Firebase under Realtime Database, then Usage. iPhone HEIC files can't be read by most browsers: export them as JPG first (or set the iPhone camera to "Most Compatible").

**From files in the repo (optional).** Put originals in `raw_photos/year1/` … `raw_photos/year5/`, run `pip install Pillow` once and then `python scripts/compress.py`, and add an entry per photo to `src/content/memories.json` (`file`, `date`, `place`, `caption`). These show before any uploaded photos in each year. `memories.json` ships empty so placeholders don't clutter the walls.

### Music (optional)

Drop an MP3 at `public/music.mp3`. A small music button appears in the corner (off by default). With no file, the button stays hidden.

---

## One time setup (the clicking part)

### 1. Firebase (free Spark plan, no billing account)

1. Go to <https://console.firebase.google.com>, **Add project** (Google Analytics can be off).
2. **Build → Authentication → Get started → Sign-in method → Anonymous → Enable.**
3. **Build → Realtime Database → Create database**, location **Singapore (asia-southeast1)**, start in **locked mode**.
4. Open the **Rules** tab, paste the contents of `database.rules.json`, **Publish**.
5. **Project settings (gear) → Your apps → Web (`</>`)**, register an app (no Firebase Hosting needed). Copy the config values.

Do not enable Firebase Storage: it now needs a billing account, and this app doesn't use it.

### 2. Environment variables

```bash
cp .env.example .env.local
node scripts/hash-password.mjs "our password"     # prints the hash
```

Fill `.env.local`:

```
VITE_SITE_PASSWORD_HASH=<hash from above>
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.asia-southeast1.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_APP_ID=...
```

The password is case sensitive. Changing it later logs everyone out (they just type the new one).

### 3. GitHub and Vercel (Hobby, free)

1. Create a **private** repo on GitHub and push:
   ```bash
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```
2. On <https://vercel.com/new> import the repo. The framework preset is **Vite** (build `npm run build`, output `dist`), detected automatically.
3. Before deploying, open **Environment Variables** and add every `VITE_` variable from `.env.local` (not `VITE_USE_FIREBASE_EMULATOR`). Deploy.
4. If you change env vars later, redeploy (Deployments → … → Redeploy), because Vite bakes them in at build time.

`vercel.json` already rewrites every route to `index.html` and sends a `noindex` header. `robots.txt` disallows all crawlers.

### 4. Authorise the domain in Firebase

**Authentication → Settings → Authorized domains → Add domain**, and add your `*.vercel.app` domain (and any custom domain).

### 5. Test before the big day

1. Open the site in a normal window and in an incognito window (or two browsers).
2. In **Play together**, pick a different person in each window. Both badges should turn green.
3. Play both games to the end, refreshing one window mid game: it should pick up exactly where it was.
4. Repeat once from two different networks (for example laptop on Wi-Fi, phone hotspot on the other).
5. Check the finale with `https://<your-site>/finale?preview=1` (`?preview=0` turns preview off again in that tab).

---

## How the games stay in sync

Both games live under one database path, `rooms/anniversary`:

```
rooms/anniversary/
  players/me | her      { uid, online, lastSeen }   (presence, onDisconnect marks offline)
  match/                memory game state (deck, flipped, matched, scores, turn, mode, …)
  matchBest/            best co-op result
  quiz/                 quiz state (round order, answers, reveal, scores)
  gallery/meta/y1..y5/  uploaded photo captions, dates, places
  gallery/data/         uploaded photos (shrunk, as data URLs)
```

Every move goes through a Firebase transaction, so simultaneous clicks can't corrupt the state. Each screen renders only from the database, which is why a refresh or a dropped connection picks up exactly where the game was. Either player can press **Reset game** at any time.

Players are stored as `me` and `her` (not by name), so renaming in `config.ts` never breaks saved state.

### Local multiplayer testing with the emulator (optional)

Needs Java 11+.

```bash
npx firebase-tools emulators:start --only auth,database --project demo-anniversary
# in another terminal
VITE_USE_FIREBASE_EMULATOR=1 npm run dev
```

On Windows PowerShell, use `$env:VITE_USE_FIREBASE_EMULATOR=1; npm run dev`.

---

## Security, honestly

This is a gift, not a bank. The password gate runs in the browser: it keeps casual visitors and search engines out, but someone determined could read the bundle or guess a photo URL like `/photos/year1/01.webp`. The database rules only allow signed in users to touch `rooms/`, but anonymous sign in is open to anyone holding the site's Firebase config. Don't put anything on the site you'd be devastated to see leaked.

---

## Troubleshooting

- **Games stuck on "Connecting…"**: check the `VITE_FIREBASE_*` values, that Anonymous sign in is enabled, and that the Vercel domain is in Authorized domains.
- **`PERMISSION_DENIED`**: the rules from `database.rules.json` weren't published.
- **Photos not showing**: file names in `memories.json` must match `public/photos/yearN/` exactly, including case.
- **Map tiles grey**: an ad or tracker blocker may be blocking `tile.openstreetmap.org`.
- **Git on Windows says "dubious ownership"**: run `git config --global --add safe.directory E:/Code/5-year-celebration`.
