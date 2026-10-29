# FactoryTrack

Factory Visit & Business Location Management System. Records factory visits, stores locations, and hands navigation to Google Maps. Runs entirely in the browser: no backend, no cloud database, no API keys.

## Run on Windows
1. Install Node.js 18+ from https://nodejs.org
2. Open a terminal in this folder
3. `npm install`
4. `npm run dev`
5. Open the URL Vite prints (usually http://localhost:5173)

## Data
Stored in IndexedDB (Dexie) in your browser profile. 20 fictional demo companies are seeded on first launch only. Settings > Restore Demo Data re-adds them without duplicates. Demo coordinates are approximate city-level points, not real factory entrances.

## Map and Google Maps
The Map page shows every saved pin on an in-app map (OpenStreetMap tiles, no key) with a city dropdown. Company pages embed a Google Maps view. Google's multi-pin map needs an API key, so the all-pins map is OpenStreetMap; Directions always open Google Maps. Pasting a full Google Maps link fills the pin, nearest city and name automatically. Short links cannot be read without a server, so enter latitude/longitude for those.

No API key. View Location opens the saved Maps URL, else coordinates, else an address search. Get Directions opens `google.com/maps/dir/?api=1&destination=...&travelmode=...`; Google decides the start point. Short `maps.app.goo.gl` links are saved as pasted; they are not resolved to coordinates.

## Backup
Settings > Export all data (JSON). Import offers Merge (conflicting IDs re-issued) or Replace. CSV exports are on the Reports page.

## Limitations
Single user, single browser. Clearing browser data deletes records unless you exported a backup. No geocoding of addresses; the map needs internet for tiles. Preferred date format setting is not included.
