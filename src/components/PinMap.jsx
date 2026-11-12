import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { viewUrl, dirUrl } from '../utils/googleMaps.js';
import { getCategoryMeta, DEFAULT_CATEGORY } from '../constants/categories.js';

const getPinIcon = (categoryKey) => {
  const meta = getCategoryMeta(categoryKey) || DEFAULT_CATEGORY;
  const color = meta.color;
  const radar = meta.radar;

  const html = `
    <div class="pin-wrapper">
      <div class="pin-radar" style="background: ${radar};"></div>
      <div class="pin-core" style="background: ${color}; box-shadow: 0 4px 12px ${radar}, 0 2px 4px rgba(0,0,0,0.25);"></div>
    </div>
  `;

  return L.divIcon({
    className: '',
    html,
    iconSize: [36, 36],
    iconAnchor: [18, 30],
    popupAnchor: [0, -28],
  });
};

const esc = (s) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// In-app map: OpenStreetMap tiles (no key). Pins come from saved coordinates with category colored pins.
export default function PinMap({ items, selectedId, onSelect, mode = 'driving' }) {
  const el = useRef(),
    map = useRef(),
    layer = useRef(),
    marks = useRef({});

  useEffect(() => {
    map.current = L.map(el.current).setView([22.5, 79], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => map.current.remove();
  }, []);

  useEffect(() => {
    layer.current.clearLayers();
    marks.current = {};
    const pts = [];
    items.forEach((c) => {
      const ll = [+c.latitude, +c.longitude];
      const catMeta = getCategoryMeta(c.category) || DEFAULT_CATEGORY;
      const catBadge = c.category
        ? `<span style="display:inline-block;padding:2px 8px;font-size:10px;font-weight:700;border-radius:12px;background:${catMeta.color}15;color:${catMeta.color};border:1px solid ${catMeta.color}40;margin-bottom:6px">${esc(catMeta.label || c.category)}</span>`
        : '';

      const html = `<div style="min-width:200px">
        ${catBadge}
        <b style="font-size:13px;display:block">${esc(c.companyName)}</b>
        <div style="color:#69736F;font-size:12px;margin:2px 0 8px">${esc([c.city, c.state].filter(Boolean).join(', '))}</div>
        <a href="${esc(viewUrl(c))}" target="_blank" rel="noopener noreferrer" class="pl">Open in Google Maps</a> · <a href="${esc(dirUrl(c, mode))}" target="_blank" rel="noopener noreferrer" class="pl">Directions</a><br/><a href="#/company/${esc(c.id)}" class="pl">View details</a>
      </div>`;

      const icon = getPinIcon(c.category);
      const m = L.marker(ll, { icon, title: c.companyName })
        .bindPopup(html)
        .on('click', () => onSelect?.(c.id))
        .addTo(layer.current);
      marks.current[c.id] = m;
      pts.push(ll);
    });
    if (pts.length) map.current.fitBounds(pts, { padding: [50, 50], maxZoom: 13 });
  }, [items, mode]);

  useEffect(() => {
    const m = marks.current[selectedId];
    if (m) {
      map.current.setView(m.getLatLng(), Math.max(map.current.getZoom(), 14));
      m.openPopup();
    }
  }, [selectedId]);

  return <div ref={el} className="h-full w-full rounded-xl" style={{ zIndex: 0 }} />;
}
