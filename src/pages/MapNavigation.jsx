import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Navigation, Search, MapPinOff, Compass, Building, ArrowRight } from 'lucide-react';
import { useData, useSettings } from '../database/useData.js';
import { Head, Loading, useToast } from '../components/ui.jsx';
import PinMap from '../components/PinMap.jsx';
import { fmt } from '../utils/dates.js';
import { hasCoords, hasLocation, viewUrl, dirUrl, openUrl } from '../utils/googleMaps.js';

export default function MapNavigation() {
  const { rows, loading } = useData();
  const s = useSettings();
  const toast = useToast();
  const [city, setCity] = useState('');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(null);

  const cities = useMemo(() => {
    const m = {};
    rows
      .filter((r) => hasCoords(r))
      .forEach((r) => {
        const k = r.city || 'No city';
        m[k] = (m[k] || 0) + 1;
      });
    return Object.entries(m).sort((a, b) => a[0].localeCompare(b[0]));
  }, [rows]);

  const list = useMemo(
    () =>
      rows
        .filter(
          (r) =>
            (!city || (r.city || 'No city') === city) &&
            (!q ||
              [r.companyName, r.city, r.contactPerson, r.products?.join(' ')]
                .join(' ')
                .toLowerCase()
                .includes(q.toLowerCase()))
        )
        .sort((a, b) => a.companyName.localeCompare(b.companyName)),
    [rows, city, q]
  );

  const pins = useMemo(() => list.filter(hasCoords), [list]);

  if (loading) return <Loading />;
  const noPin = rows.filter((r) => !hasCoords(r)).length;

  return (
    <div className="space-y-5">
      <Head
        title="Interactive Factory Map"
        sub={`${pins.length} geo-pinned factories${
          noPin ? ` · ${noPin} facilities pending coordinates` : ''
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">
            Filter City:
          </span>
          <select
            className="input !w-64 !font-bold !text-xs bg-white shadow-sm border-slate-200"
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              setSel(null);
            }}
            aria-label="Select city"
          >
            <option value="">All Cities ({rows.filter(hasCoords).length} pins)</option>
            {cities.map(([c, n]) => (
              <option key={c} value={c}>
                {c} ({n} factories)
              </option>
            ))}
          </select>
        </div>
      </Head>

      {/* Split Navigation Explorer */}
      <div
        className="flex flex-col lg:grid lg:grid-cols-[380px_1fr] gap-4 lg:gap-5"
        style={{ minHeight: 'auto' }}
      >
        {/* Left List Pane */}
        <div className="card order-2 lg:order-1 flex flex-col min-h-0 h-80 lg:h-[calc(100vh-14rem)] overflow-hidden bg-white shadow-sm">
          <div className="p-3.5 border-b border-slate-100 bg-slate-50/50 relative">
            <Search size={15} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input !pl-9 !py-2 !text-xs bg-white"
              placeholder="Search companies in this view…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-slate-100 p-1">
            {list.length === 0 && (
              <div className="p-12 text-center text-xs text-slate-400 font-medium">
                No factories match this location filter.
              </div>
            )}
            {list.map((c) => {
              const active = sel === c.id;
              const pinned = hasCoords(c);
              return (
                <div
                  key={c.id}
                  onClick={() => pinned && setSel(c.id)}
                  className={`p-3.5 rounded-xl cursor-pointer transition-all duration-200 ${
                    active
                      ? 'bg-indigo-50/90 border border-indigo-200/80 shadow-xs'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <Link
                      to={`/company/${c.id}`}
                      className={`font-bold text-sm hover:underline ${
                        active ? 'text-indigo-700' : 'text-slate-800'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {c.companyName}
                    </Link>

                    {!pinned && (
                      <span
                        className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 text-[10px] font-semibold flex items-center gap-1 border border-amber-200/60"
                        title="No coordinates: Paste full Google Maps link to detect pin"
                      >
                        <MapPinOff size={11} />
                        <span>No Pin</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    {[c.city, c.state].filter(Boolean).join(', ') || 'Unspecified location'}
                    <span className="text-slate-300 mx-1.5">·</span>
                    <span className="font-mono text-[11px]">Last visit: {fmt(c.lastVisit)}</span>
                  </p>

                  <div className="flex items-center gap-2 mt-2.5">
                    <button
                      className="btn !py-1 !px-2.5 !text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        openUrl(viewUrl(c), toast);
                      }}
                      disabled={!hasLocation(c)}
                    >
                      <MapPin size={12} className="text-indigo-600" />
                      <span>Google Maps</span>
                    </button>
                    <button
                      className="btn !py-1 !px-2.5 !text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        openUrl(dirUrl(c, s.defaultTravelMode), toast);
                      }}
                      disabled={!hasLocation(c)}
                    >
                      <Navigation size={12} className="text-cyan-600" />
                      <span>Directions</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Map Canvas with Border Glow */}
        <div className="card order-1 lg:order-2 p-2 h-[340px] sm:h-[420px] lg:h-[calc(100vh-14rem)] bg-white shadow-sm overflow-hidden relative border border-slate-200/80">
          <PinMap items={pins} selectedId={sel} onSelect={setSel} mode={s.defaultTravelMode} />
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium px-1">
        <span>Tiles provided by OpenStreetMap contributors. Coordinates parsed automatically.</span>
        <span className="hidden sm:inline">Directions launch directly in Google Maps application.</span>
      </div>
    </div>
  );
}

