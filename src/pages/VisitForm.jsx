import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ExternalLink, Save, ChevronDown, CheckCircle2, AlertCircle, Link2, MapPin, Building, Calendar, Layers, CheckSquare, Compass } from 'lucide-react';
import { useData, useSettings } from '../database/useData.js';
import { saveCompany, saveVisit } from '../database/repositories.js';
import { Head, Field, Modal, Confirm, Loading, useToast } from '../components/ui.jsx';
import { INDUSTRIES, uniq } from './Companies.jsx';
import { SAMPLE_PRODUCTS } from '../constants/products.js';
import { today } from '../utils/dates.js';
import { isMapsUrl, viewUrl } from '../utils/googleMaps.js';
import { parseMapsLink, isShortLink, nearestCity, stateOf, CITY_NAMES } from '../utils/geo.js';

const CF = [
  'companyName',
  'ownerName',
  'ownerContact',
  'ownerContact2',
  'city',
  'siteAddress',
  'contactPersonName',
  'contactPersonNumber',
  'industry',
  'contactPerson',
  'designation',
  'phone',
  'email',
  'website',
  'description',
  'factoryName',
  'addressLine1',
  'addressLine2',
  'state',
  'pinCode',
  'country',
  'googleMapsUrl',
  'latitude',
  'longitude',
];
const VT = ['First Visit', 'Repeat Visit', 'Follow-up Visit', 'Business Meeting', 'Other'];
const list = (s) =>
  s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

const blank = (vt) => ({
  // Google Form Company Details
  companyName: '',
  ownerName: '',
  ownerContact: '',
  ownerContact2: '',
  city: '',
  siteAddress: '',
  contactPersonName: '',
  contactPersonNumber: '',

  // Google Form Visit Details
  whichProductUsing: '',
  suggestedProduct: '',
  samplesGiven: [],
  samplesGivenOther: '',
  testingDoneAtSite: '',
  note: '',

  // General & Geo fields
  industry: '',
  contactPerson: '',
  designation: '',
  phone: '',
  email: '',
  website: '',
  description: '',
  factoryName: '',
  addressLine1: '',
  addressLine2: '',
  state: '',
  pinCode: '',
  country: 'India',
  googleMapsUrl: '',
  latitude: '',
  longitude: '',
  productsText: '',
  visitDate: today(),
  visitType: vt,
  purpose: '',
  discussedText: '',
  businessOpportunities: '',
  meetingNotes: '',
});

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

const Sec = ({ n, title, icon: Icon, children }) => (
  <section className="card p-6 bg-white space-y-4 shadow-sm border border-slate-200">
    <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white font-bold text-xs flex items-center justify-center shadow-xs font-display">
        {n}
      </div>
      <h2 className="font-extrabold text-base text-slate-900 font-display flex items-center gap-2">
        {Icon && <Icon size={18} className="text-indigo-600" />}
        <span>{title}</span>
      </h2>
    </div>
    {children}
  </section>
);

const G = ({ children }) => <div className="grid sm:grid-cols-2 gap-4">{children}</div>;

export default function VisitForm({ mode }) {
  const { id, visitId } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const { rows, visits, byId, loading } = useData();
  const s = useSettings();

  const [f, setF] = useState(() => blank('First Visit'));
  const [locMode, setLocMode] = useState('link'); // 'link' or 'coords'
  const [combinedCoords, setCombinedCoords] = useState('');
  const [err, setErr] = useState({});
  const [dirty, setDirty] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [dup, setDup] = useState(null);
  const [leave, setLeave] = useState(false);
  const [saving, setSaving] = useState(false);

  const visit = mode === 'editVisit' ? visits.find((v) => v.id === visitId) : null;
  const cid = mode === 'editVisit' ? visit?.companyId : mode === 'new' ? null : id;
  const company = cid ? byId[cid] : null;

  useEffect(() => {
    if (loading || loaded) return;
    if (mode === 'new') {
      setF(blank(s.defaultVisitType));
      setLoaded(true);
      return;
    }
    if (!company) return;
    const base = blank(mode === 'visit' ? 'Follow-up Visit' : 'First Visit');
    CF.forEach((k) => {
      base[k] = company[k] ?? base[k];
    });
    base.productsText = (company.products || []).join(', ');
    if (visit)
      Object.assign(base, {
        ...visit,
        discussedText: (visit.productsDiscussed || []).join(', '),
      });
    setF(base);
    if (base.latitude !== '' && base.longitude !== '') {
      setCombinedCoords(`${base.latitude}, ${base.longitude}`);
    }
    setLoaded(true);
  }, [loading, loaded, company, visit, mode, s.defaultVisitType]);

  useEffect(() => {
    const h = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  if (loading || (!loaded && mode !== 'new'))
    return mode !== 'new' && !company && !loading ? (
      <div className="p-12 text-center text-slate-500 font-semibold">Record not found.</div>
    ) : (
      <Loading />
    );

  const showCo = mode === 'new' || mode === 'editCompany';
  const showVisit = mode !== 'editCompany';
  const ch = (k) => (e) => {
    setF({ ...f, [k]: e.target.value });
    setDirty(true);
  };

  const onLink = (e) => {
    const url = e.target.value;
    const n = { ...f, googleMapsUrl: url };
    setDirty(true);
    const p = parseMapsLink(url);
    if (p?.lat != null) {
      n.latitude = p.lat;
      n.longitude = p.lng;
      setCombinedCoords(`${p.lat}, ${p.lng}`);
      const near = nearestCity(p.lat, p.lng);
      if (near && !f.city) {
        n.city = near.city;
        n.state = near.state;
      }
      if (p.name && !f.companyName) n.companyName = p.name;
    } else if (url.trim() === '') {
      n.latitude = '';
      n.longitude = '';
      setCombinedCoords('');
    }
    setF(n);
  };

  const onCombinedCoordsChange = (e) => {
    const text = e.target.value;
    setCombinedCoords(text);
    setDirty(true);

    // Try parsing latitude, longitude from text like "22.7196, 75.8577" or "22.7196 75.8577"
    const m = text.trim().match(/^(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)$/);
    if (m) {
      const lat = m[1];
      const lng = m[2];
      const n = {
        ...f,
        latitude: lat,
        longitude: lng,
        googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
      };
      const near = nearestCity(+lat, +lng);
      if (near && !f.city) {
        n.city = near.city;
        n.state = near.state;
      }
      setF(n);
    } else if (text.trim() === '') {
      setF({ ...f, latitude: '', longitude: '', googleMapsUrl: '' });
    }
  };

  const onSeparateCoordChange = (key) => (e) => {
    const val = e.target.value;
    const otherKey = key === 'latitude' ? 'longitude' : 'latitude';
    const otherVal = f[otherKey];
    const n = { ...f, [key]: val };
    setDirty(true);

    if (val.trim() && otherVal.trim()) {
      const lat = key === 'latitude' ? val.trim() : otherVal.trim();
      const lng = key === 'longitude' ? val.trim() : otherVal.trim();
      setCombinedCoords(`${lat}, ${lng}`);
      n.googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      const near = nearestCity(+lat, +lng);
      if (near && !f.city) {
        n.city = near.city;
        n.state = near.state;
      }
    }
    setF(n);
  };

  const onCity = (e) => {
    const city = e.target.value;
    setF({ ...f, city, state: stateOf(city) || f.state });
    setDirty(true);
  };

  const linkOk = f.googleMapsUrl.trim() && isMapsUrl(f.googleMapsUrl.trim());
  const hasPin = f.latitude !== '' && f.longitude !== '' && !isNaN(+f.latitude);

  const validate = () => {
    const e = {};
    if (showCo) {
      if (!f.companyName.trim()) e.companyName = 'Company name is required';
      if (!f.ownerName?.trim()) e.ownerName = 'Owner name is required';
      if (!f.ownerContact?.trim()) e.ownerContact = 'Owner contact number is required';
      if (!f.city?.trim()) e.city = 'City is required';
      if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Enter a valid email';
      if (f.googleMapsUrl.trim() && !linkOk)
        e.googleMapsUrl = 'This does not look like a Google Maps link';
      const la = f.latitude !== '',
        lo = f.longitude !== '';
      if (la !== lo) e.latitude = 'Enter both latitude and longitude';
      else if (la && (isNaN(+f.latitude) || +f.latitude < -90 || +f.latitude > 90))
        e.latitude = 'Latitude must be between -90 and 90';
      if (lo && (isNaN(+f.longitude) || +f.longitude < -180 || +f.longitude > 180))
        e.longitude = 'Longitude must be between -180 and 180';
    }
    if (showVisit && !f.visitDate) e.visitDate = 'Visit date is required';
    setErr(e);
    if (Object.keys(e).length) toast('Please fix highlighted fields', 'err');
    return !Object.keys(e).length;
  };

  const persist = async () => {
    setSaving(true);
    try {
      let co = company;
      if (showCo) {
        const data = { ...(company || {}) };
        CF.forEach((k) => {
          data[k] = typeof f[k] === 'string' ? f[k].trim() : f[k];
        });
        data.products = list(f.productsText);
        if (data.latitude !== '' && data.latitude != null) {
          data.latitude = +data.latitude;
          data.longitude = +data.longitude;
        }
        if (!data.googleMapsUrl && data.latitude !== '')
          data.googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${data.latitude},${data.longitude}`;
        co = await saveCompany(data);
      }
      if (showVisit) {
        await saveVisit({
          ...(visit || {}),
          companyId: co.id,
          visitDate: f.visitDate,
          visitType: f.visitType,
          whichProductUsing: f.whichProductUsing || '',
          suggestedProduct: f.suggestedProduct || '',
          samplesGiven: f.samplesGiven || [],
          samplesGivenOther: f.samplesGivenOther || '',
          testingDoneAtSite: f.testingDoneAtSite || '',
          note: f.note || '',
          purpose: f.purpose,
          productsDiscussed: list(f.discussedText),
          businessOpportunities: f.businessOpportunities,
          meetingNotes: f.meetingNotes || f.note || '',
        });
      }
      setDirty(false);
      toast('Saved successfully');
      nav(`/company/${co.id}`);
    } catch (e) {
      toast('Save failed: ' + (e.message || 'local database error'), 'err');
      setSaving(false);
    }
  };

  const submit = () => {
    if (!validate()) return;
    if (mode === 'new') {
      const n = norm(f.companyName);
      const m = rows.find((r) => {
        const x = norm(r.companyName);
        return x === n || (n.length > 3 && x.length > 3 && (x.includes(n) || n.includes(x)));
      });
      if (m) return setDup(m);
    }
    persist();
  };

  const titles = {
    new: 'Record Factory Visit',
    visit: `New Visit · ${company?.companyName}`,
    editVisit: 'Edit Visit Record',
    editCompany: 'Edit Factory Details',
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <Head
        title={titles[mode]}
        sub={
          dirty
            ? 'You have unsaved changes'
            : 'Paste a Google Maps share link to auto-fill location and city.'
        }
      >
        <button
          className="btn"
          onClick={() => (dirty ? setLeave(true) : nav(-1))}
        >
          Cancel
        </button>
        <button
          className="btn btn-p shadow-glow-brand"
          disabled={saving}
          onClick={submit}
        >
          <Save size={15} />
          <span>{saving ? 'Saving…' : 'Save Record'}</span>
        </button>
      </Head>

      {/* Step 1: Company & Maps Location */}
      {showCo && (
        <Sec n="1" title="Company & Factory Location" icon={MapPin}>
          <div className="space-y-4">
            {/* Input Selection Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <button
                type="button"
                onClick={() => setLocMode('link')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  locMode === 'link'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80'
                }`}
              >
                <Link2 size={14} />
                <span>Google Maps Link</span>
              </button>
              <button
                type="button"
                onClick={() => setLocMode('coords')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  locMode === 'coords'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80'
                }`}
              >
                <Compass size={14} />
                <span>GPS Coordinates (Lat & Long)</span>
              </button>
            </div>

            {locMode === 'link' && (
              <Field label="Google Maps Location Link" error={err.googleMapsUrl}>
                <div className="relative">
                  <Link2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    className="input !pl-10 !bg-slate-50 focus:!bg-white"
                    value={f.googleMapsUrl}
                    onChange={onLink}
                    placeholder="Paste link from Google Maps (Share → Copy link or browser address bar)"
                  />
                </div>
              </Field>
            )}

            {locMode === 'coords' && (
              <div className="space-y-3 p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80">
                <Field label="Enter Coordinates Together (Lat, Lng)" error={err.latitude || err.longitude}>
                  <div className="relative">
                    <Compass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-500" />
                    <input
                      className="input !pl-10 !bg-white"
                      value={combinedCoords}
                      onChange={onCombinedCoordsChange}
                      placeholder="e.g. 22.7196, 75.8577"
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Paste both coordinates together separated by comma or space.
                  </span>
                </Field>

                <div className="flex items-center gap-3 my-1">
                  <div className="h-px bg-slate-200 flex-1" />
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">or enter separately</span>
                  <div className="h-px bg-slate-200 flex-1" />
                </div>

                <G>
                  <Field label="Latitude" error={err.latitude}>
                    <input
                      className="input bg-white"
                      value={f.latitude}
                      onChange={onSeparateCoordChange('latitude')}
                      placeholder="e.g. 22.7196"
                    />
                  </Field>
                  <Field label="Longitude" error={err.longitude}>
                    <input
                      className="input bg-white"
                      value={f.longitude}
                      onChange={onSeparateCoordChange('longitude')}
                      placeholder="e.g. 75.8577"
                    />
                  </Field>
                </G>
              </div>
            )}

            {hasPin && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-semibold flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>
                    GPS Pin: ({+(+f.latitude).toFixed(4)}, {+(+f.longitude).toFixed(4)}) ready for navigation & map.
                  </span>
                </div>
                {viewUrl(f) && (
                  <button
                    type="button"
                    className="btn !text-[11px] !py-1 !px-2 bg-white hover:bg-slate-50 text-indigo-600 shrink-0"
                    onClick={() => window.open(viewUrl(f), '_blank', 'noopener,noreferrer')}
                  >
                    <ExternalLink size={12} />
                    <span>Test in Maps</span>
                  </button>
                )}
              </div>
            )}

            {locMode === 'link' && linkOk && !hasPin && (
              <div className="text-xs bg-amber-50 text-amber-800 rounded-xl p-3.5 flex gap-2.5 border border-amber-200/80">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600" />
                <p className="leading-relaxed">
                  {isShortLink(f.googleMapsUrl)
                    ? 'Short link detected: Open it in your browser and paste the full address bar URL, or switch to the "GPS Coordinates" tab above to enter latitude and longitude.'
                    : 'No coordinates found in this link. Switch to the "GPS Coordinates" tab above to type latitude and longitude directly.'}
                </p>
              </div>
            )}

            <G>
              <Field label="Company Name" req error={err.companyName}>
                <input
                  className="input font-semibold bg-slate-50 focus:bg-white"
                  value={f.companyName}
                  onChange={ch('companyName')}
                  placeholder="Company Name"
                />
              </Field>
              <Field label="City" req error={err.city}>
                <input
                  className="input bg-slate-50 focus:bg-white"
                  list="cities"
                  value={f.city}
                  onChange={onCity}
                  placeholder="City"
                />
                <datalist id="cities">
                  {uniq([...CITY_NAMES, ...rows.map((r) => r.city)]).map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </Field>

              <Field label="Owner Name" req error={err.ownerName}>
                <input
                  className="input bg-slate-50 focus:bg-white"
                  value={f.ownerName}
                  onChange={ch('ownerName')}
                  placeholder="Owner Name"
                />
              </Field>
              <Field label="Owner Contact Number" req error={err.ownerContact}>
                <input
                  className="input bg-slate-50 focus:bg-white font-mono text-xs"
                  value={f.ownerContact}
                  onChange={ch('ownerContact')}
                  placeholder="Owner Contact Number"
                />
              </Field>

              <Field label="Owner Contact 2">
                <input
                  className="input bg-slate-50 focus:bg-white font-mono text-xs"
                  value={f.ownerContact2}
                  onChange={ch('ownerContact2')}
                  placeholder="Secondary contact (optional)"
                />
              </Field>
              <Field label="Site Address">
                <input
                  className="input bg-slate-50 focus:bg-white"
                  value={f.siteAddress}
                  onChange={ch('siteAddress')}
                  placeholder="Site / Factory Address"
                />
              </Field>

              <Field label="Contact Person Name">
                <input
                  className="input bg-slate-50 focus:bg-white"
                  value={f.contactPersonName}
                  onChange={ch('contactPersonName')}
                  placeholder="Contact Person Name"
                />
              </Field>
              <Field label="Contact Person Number">
                <input
                  className="input bg-slate-50 focus:bg-white font-mono text-xs"
                  value={f.contactPersonNumber}
                  onChange={ch('contactPersonNumber')}
                  placeholder="Contact Person Number"
                />
              </Field>
            </G>
          </div>
        </Sec>
      )}

      {/* Step 2: Visit & Meeting Log */}
      {showVisit && (
        <Sec n={showCo ? '2' : '1'} title="Visit & Product Details" icon={Calendar}>
          <div className="space-y-4">
            <G>
              <Field label="Visit Date" req error={err.visitDate}>
                <input
                  type="date"
                  className="input bg-slate-50 focus:bg-white font-mono"
                  value={f.visitDate}
                  onChange={ch('visitDate')}
                />
              </Field>
              <Field label="Visit Type">
                <select
                  className="input bg-slate-50 focus:bg-white"
                  value={f.visitType}
                  onChange={ch('visitType')}
                >
                  {VT.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>

              <Field label="Which product Using">
                <input
                  className="input bg-slate-50 focus:bg-white"
                  value={f.whichProductUsing}
                  onChange={ch('whichProductUsing')}
                  placeholder="Current product used by company"
                />
              </Field>

              <Field label="Suggested Product">
                <input
                  className="input bg-slate-50 focus:bg-white"
                  value={f.suggestedProduct}
                  onChange={ch('suggestedProduct')}
                  placeholder="Recommended / Suggested product"
                />
              </Field>
            </G>

            {/* Any Sample Given Checkbox Matrix */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Any Sample given
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                {SAMPLE_PRODUCTS.map((p) => {
                  const checked = (f.samplesGiven || []).includes(p);
                  return (
                    <label
                      key={p}
                      className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors text-xs font-semibold ${
                        checked
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'hover:bg-white text-slate-700 border border-transparent'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                        checked={checked}
                        onChange={() => {
                          const cur = f.samplesGiven || [];
                          const updated = checked
                            ? cur.filter((x) => x !== p)
                            : [...cur, p];
                          setF({ ...f, samplesGiven: updated });
                          setDirty(true);
                        }}
                      />
                      <span>{p}</span>
                    </label>
                  );
                })}
              </div>

              {/* Other sample input */}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-bold text-slate-600 shrink-0">Other:</span>
                <input
                  className="input !py-1.5 !px-3 text-xs bg-slate-50 focus:bg-white"
                  value={f.samplesGivenOther || ''}
                  onChange={ch('samplesGivenOther')}
                  placeholder="Specify other sample..."
                />
              </div>
            </div>

            <Field label="Any Testing Done at their Site">
              <textarea
                rows={2}
                className="input bg-slate-50 focus:bg-white"
                value={f.testingDoneAtSite}
                onChange={ch('testingDoneAtSite')}
                placeholder="Details of testing or trials performed on site"
              />
            </Field>

            <Field label="Note">
              <textarea
                rows={3}
                className="input bg-slate-50 focus:bg-white"
                value={f.note}
                onChange={(e) => {
                  setF({ ...f, note: e.target.value, meetingNotes: e.target.value });
                  setDirty(true);
                }}
                placeholder="Important visit notes, discussions, observations..."
              />
            </Field>
          </div>
        </Sec>
      )}

      {/* Discard Changes Prompt */}
      {leave && (
        <Confirm
          title="Discard Unsaved Changes?"
          text="You have unpersisted inputs in this form. If you leave now, these modifications will be lost."
          yes="Discard Changes"
          onNo={() => setLeave(false)}
          onYes={() => {
            setDirty(false);
            nav(-1);
          }}
        />
      )}

      {/* Duplicate Alert Modal */}
      {dup && (
        <Modal
          title="Potential Duplicate Company Detected"
          onClose={() => setDup(null)}
          footer={
            <>
              <button className="btn" onClick={() => nav(`/company/${dup.id}`)}>
                Open Existing Profile
              </button>
              <button className="btn" onClick={() => nav(`/company/${dup.id}/visit`)}>
                Log Visit for Existing
              </button>
              <button
                className="btn btn-p"
                onClick={() => {
                  setDup(null);
                  persist();
                }}
              >
                Create As New Company
              </button>
            </>
          }
        >
          An account named “{dup.companyName}” ({dup.city}, {dup.state}) already exists in your local vault. Would you like to view it or record a visit under it instead?
        </Modal>
      )}
    </div>
  );
}

