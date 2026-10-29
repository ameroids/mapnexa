// Pulls coordinates out of a full Google Maps URL (no network needed).
export function parseMapsLink(url) {
  if (!url) return null;
  let u = url.trim(); try { u = decodeURIComponent(u); } catch { /* keep raw */ }
  const m = u.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/) || u.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || u.match(/[?&](?:q|query|ll|destination|daddr)=(-?\d+\.\d+)[,+ ]\s*(-?\d+\.\d+)/);
  const place = u.match(/\/place\/([^/@?]+)/);
  const name = place && !/^-?\d/.test(place[1]) ? place[1].replace(/\+/g, ' ').trim() : '';
  return { lat: m ? +m[1] : null, lng: m ? +m[2] : null, name };
}
export const isShortLink = (u) => /^https:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps)/.test((u || '').trim());
// Offline lookup of the nearest major Indian city (within ~80 km) so the city dropdown fills itself.
const C = 'Indore,Madhya Pradesh,22.72,75.86;Bhopal,Madhya Pradesh,23.26,77.41;Jabalpur,Madhya Pradesh,23.18,79.99;Gwalior,Madhya Pradesh,26.22,78.18;Pithampur,Madhya Pradesh,22.61,75.69;Pune,Maharashtra,18.52,73.86;Mumbai,Maharashtra,19.08,72.88;Nagpur,Maharashtra,21.15,79.09;Nashik,Maharashtra,19.99,73.79;Aurangabad,Maharashtra,19.88,75.34;Surat,Gujarat,21.17,72.83;Ahmedabad,Gujarat,23.02,72.57;Vadodara,Gujarat,22.31,73.18;Rajkot,Gujarat,22.3,70.8;Gandhidham,Gujarat,23.08,70.13;Delhi,Delhi,28.61,77.21;Gurugram,Haryana,28.46,77.03;Faridabad,Haryana,28.41,77.31;Jaipur,Rajasthan,26.91,75.79;Jodhpur,Rajasthan,26.24,73.02;Udaipur,Rajasthan,24.59,73.71;Coimbatore,Tamil Nadu,11.02,76.96;Chennai,Tamil Nadu,13.08,80.27;Madurai,Tamil Nadu,9.93,78.12;Bengaluru,Karnataka,12.97,77.59;Mysuru,Karnataka,12.3,76.64;Hyderabad,Telangana,17.39,78.49;Visakhapatnam,Andhra Pradesh,17.69,83.22;Kolkata,West Bengal,22.57,88.36;Kochi,Kerala,9.93,76.27;Lucknow,Uttar Pradesh,26.85,80.95;Kanpur,Uttar Pradesh,26.45,80.35;Noida,Uttar Pradesh,28.54,77.39;Agra,Uttar Pradesh,27.18,78.01;Ludhiana,Punjab,30.9,75.86;Chandigarh,Chandigarh,30.73,76.78;Bhubaneswar,Odisha,20.3,85.82;Patna,Bihar,25.59,85.14;Ranchi,Jharkhand,23.34,85.31;Raipur,Chhattisgarh,21.25,81.63;Guwahati,Assam,26.14,91.74;Dehradun,Uttarakhand,30.32,78.03;Goa,Goa,15.5,73.83';
const CITIES = C.split(';').map((r) => { const [city, state, la, lo] = r.split(','); return { city, state, lat: +la, lng: +lo }; });
export function nearestCity(lat, lng) {
  let best = null, bd = 1e9;
  for (const c of CITIES) { const dx = (c.lat - lat) * 111, dy = (c.lng - lng) * 111 * Math.cos(lat * Math.PI / 180), d = Math.hypot(dx, dy); if (d < bd) { bd = d; best = c; } }
  return bd <= 80 ? best : null;
}
export const CITY_NAMES = CITIES.map((c) => c.city);
export const stateOf = (city) => CITIES.find((c) => c.city.toLowerCase() === (city || '').toLowerCase())?.state || '';
