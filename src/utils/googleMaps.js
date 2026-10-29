export const isMapsUrl = (u) => {
  try {
    const x = new URL(u); const h = x.hostname;
    if (x.protocol !== 'https:') return false;
    if (h === 'maps.app.goo.gl') return true;
    if (h === 'goo.gl') return x.pathname.startsWith('/maps');
    return /^(www\.|maps\.)?google\.[a-z.]+$/.test(h) && (h.startsWith('maps.') || x.pathname.startsWith('/maps'));
  } catch { return false; }
};
export const hasCoords = (c) => c.latitude !== '' && c.longitude !== '' && c.latitude != null && c.longitude != null &&
  !isNaN(+c.latitude) && !isNaN(+c.longitude) && Math.abs(+c.latitude) <= 90 && Math.abs(+c.longitude) <= 180;
export const addressText = (c) => [c.factoryName || c.companyName, c.addressLine1, c.addressLine2, c.city, c.state, c.pinCode, c.country].filter(Boolean).join(', ');
const hasAddr = (c) => !!(c.addressLine1 || c.city);
const enc = encodeURIComponent;
export const viewUrl = (c) => {
  if (c.googleMapsUrl && isMapsUrl(c.googleMapsUrl)) return c.googleMapsUrl;
  if (hasCoords(c)) return `https://www.google.com/maps/search/?api=1&query=${c.latitude},${c.longitude}`;
  if (hasAddr(c)) return `https://www.google.com/maps/search/?api=1&query=${enc(addressText(c))}`;
  return null;
};
export const dirUrl = (c, mode = 'driving') => {
  const dest = hasCoords(c) ? `${c.latitude},${c.longitude}` : hasAddr(c) ? enc(addressText(c)) : null;
  if (!dest) return c.googleMapsUrl && isMapsUrl(c.googleMapsUrl) ? c.googleMapsUrl : null;
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=${mode}`;
};
export const hasLocation = (c) => !!viewUrl(c);
export const openUrl = (u, toast) => {
  if (!u) return toast?.('No usable location saved. Add a Maps link, coordinates or address.', 'err');
  window.open(u, '_blank', 'noopener,noreferrer');
};
export const copyText = async (t, toast, label = 'Copied') => {
  try { await navigator.clipboard.writeText(t); toast(label); } catch { toast('Clipboard unavailable in this browser', 'err'); }
};
// Google's keyless embed URL, used for the per-company map inside the app.
export const embedUrl = (c) => hasCoords(c) ? `https://www.google.com/maps?q=${c.latitude},${c.longitude}&z=16&output=embed`
  : hasAddr(c) ? `https://www.google.com/maps?q=${enc(addressText(c))}&z=14&output=embed` : null;
