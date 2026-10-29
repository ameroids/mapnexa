import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { viewUrl, dirUrl } from '../utils/googleMaps.js';
const icon = L.divIcon({
  className: '',
  html: '<div class="pin-wrapper"><div class="pin-radar"></div><div class="pin-core"></div></div>',
  iconSize: [36, 36],
  iconAnchor: [18, 30],
  popupAnchor: [0, -28]
});
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// In-app map: OpenStreetMap tiles (no key). Pins come from saved coordinates.
export default function PinMap({ items, selectedId, onSelect, mode = 'driving' }) {
  const el = useRef(), map = useRef(), layer = useRef(), marks = useRef({});
  useEffect(() => {
    map.current = L.map(el.current).setView([22.5, 79], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap contributors' }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => map.current.remove();
  }, []);
  useEffect(() => {
    layer.current.clearLayers(); marks.current = {}; const pts = [];
    items.forEach((c) => {
      const ll = [+c.latitude, +c.longitude];
      const html = `<div style="min-width:180px"><b>${esc(c.companyName)}</b><div style="color:#69736F;font-size:12px;margin:2px 0 8px">${esc([c.city, c.state].filter(Boolean).join(', '))}</div>
        <a href="${esc(viewUrl(c))}" target="_blank" rel="noopener noreferrer" class="pl">Open in Google Maps</a> · <a href="${esc(dirUrl(c, mode))}" target="_blank" rel="noopener noreferrer" class="pl">Directions</a><br/><a href="#/company/${esc(c.id)}" class="pl">View details</a></div>`;
      const m = L.marker(ll, { icon, title: c.companyName }).bindPopup(html).on('click', () => onSelect?.(c.id)).addTo(layer.current);
      marks.current[c.id] = m; pts.push(ll);
    });
    if (pts.length) map.current.fitBounds(pts, { padding: [50, 50], maxZoom: 13 });
  }, [items, mode]);
  useEffect(() => { const m = marks.current[selectedId]; if (m) { map.current.setView(m.getLatLng(), Math.max(map.current.getZoom(), 14)); m.openPopup(); } }, [selectedId]);
  return <div ref={el} className="h-full w-full rounded-xl" style={{ zIndex: 0 }} />;
}
