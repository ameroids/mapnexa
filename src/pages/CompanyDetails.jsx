import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Pencil,
  Plus,
  Copy,
  Trash2,
  MapPin,
  Navigation,
  Link2,
  Building,
  Phone,
  Mail,
  Globe,
  Tag,
  Compass,
  Calendar,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { useData, useSettings } from '../database/useData.js';
import { useAuth } from '../context/AuthContext.jsx';
import { deleteCompany, deleteVisit } from '../database/repositories.js';
import { Head, Empty, Loading, Confirm, useToast } from '../components/ui.jsx';
import { fmt } from '../utils/dates.js';
import { viewUrl, dirUrl, openUrl, copyText, addressText, embedUrl } from '../utils/googleMaps.js';

const Row = ({ label, value, mono }) => (
  <div className="py-2.5 border-b border-slate-100 last:border-0 grid grid-cols-3 gap-2 text-sm items-baseline">
    <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</dt>
    <dd className={`col-span-2 break-words text-slate-800 ${mono ? 'font-mono text-xs' : 'font-medium'}`}>
      {value || <span className="text-slate-300 font-normal">—</span>}
    </dd>
  </div>
);

export default function CompanyDetails() {
  const { id } = useParams();
  const { byId, loading } = useData();
  const { hasPermission } = useAuth();
  const s = useSettings();
  const toast = useToast();
  const nav = useNavigate();
  const [mode, setMode] = useState(null);
  const [del, setDel] = useState(null);
  const [delV, setDelV] = useState(null);

  const c = byId[id];
  const m = mode || s.defaultTravelMode;

  if (loading) return <Loading />;
  if (!c)
    return (
      <Empty
        title="Company not found"
        text="The requested factory record may have been removed or never created."
      >
        <Link to="/companies" className="btn btn-p">
          Back to Companies
        </Link>
      </Empty>
    );

  const addr = [c.addressLine1, c.addressLine2, c.city, c.state, c.pinCode, c.country]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="space-y-6">
      {/* Header with Title and Primary Actions */}
      <Head
        title={c.companyName}
        sub={`${c.industry || 'General Industry'} · ${c.city}, ${c.state}`}
      >
        {hasPermission('canEditCompany') && (
          <Link to={`/company/${c.id}/edit`} className="btn">
            <Pencil size={15} />
            <span>Edit Profile</span>
          </Link>
        )}
        {hasPermission('canAddVisit') && (
          <Link to={`/company/${c.id}/visit`} className="btn btn-p shadow-glow-brand">
            <Plus size={15} />
            <span>Record Visit</span>
          </Link>
        )}
        {hasPermission('canDeleteCompany') && (
          <button className="btn btn-d" onClick={() => setDel(true)}>
            <Trash2 size={15} />
            <span>Delete</span>
          </button>
        )}
      </Head>

      {/* Floating Action Strip for Navigation & Copying */}
      <div className="card p-3 flex flex-wrap items-center gap-2 bg-white/95 border-slate-200">
        <button
          className="btn btn-p !bg-indigo-600 hover:!bg-indigo-500"
          onClick={() => openUrl(viewUrl(c), toast)}
        >
          <MapPin size={15} />
          <span>View on Google Maps</span>
        </button>

        <div className="flex items-center gap-1.5 pl-1">
          <select
            className="input !w-auto !py-1.5 !px-2.5 !text-xs font-semibold bg-slate-50"
            value={m}
            onChange={(e) => setMode(e.target.value)}
            aria-label="Travel mode"
          >
            {['driving', 'walking', 'bicycling', 'transit'].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <button className="btn" onClick={() => openUrl(dirUrl(c, m), toast)}>
            <Navigation size={15} className="text-cyan-600" />
            <span>Directions</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 sm:ml-auto">
          <button
            className="btn !py-1.5 !px-2.5 !text-xs"
            onClick={() => {
              const u = viewUrl(c);
              u ? copyText(u, toast, 'Maps link copied') : toast('No location saved', 'err');
            }}
          >
            <Link2 size={13} />
            <span>Copy Link</span>
          </button>
          <button
            className="btn !py-1.5 !px-2.5 !text-xs"
            onClick={() => copyText(addressText(c), toast, 'Address copied')}
          >
            <Copy size={13} />
            <span>Address</span>
          </button>
          <button
            className="btn !py-1.5 !px-2.5 !text-xs"
            disabled={!c.phone}
            onClick={() => copyText(c.phone, toast, 'Phone number copied')}
          >
            <Copy size={13} />
            <span>Phone</span>
          </button>
        </div>
      </div>

      {/* Embedded Google Map Preview (if available) */}
      {embedUrl(c) && (
        <div className="card overflow-hidden shadow-sm border border-slate-200">
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-600">
            <span className="flex items-center gap-1.5">
              <MapPin size={14} className="text-indigo-600" />
              <span>Embedded Location Map</span>
            </span>
            <a
              href={viewUrl(c)}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 hover:underline flex items-center gap-1"
            >
              <span>Full Maps</span>
              <ExternalLink size={12} />
            </a>
          </div>
          <iframe
            title="Location map"
            src={embedUrl(c)}
            className="w-full h-72 border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      )}

      {/* Details Grid: Company Profile & Visit Summary */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Company Profile Card */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Building size={18} />
            </span>
            <h3 className="font-extrabold text-base text-slate-900 font-display">
              Company & Factory Profile
            </h3>
          </div>

          <dl>
            <Row label="Owner Name" value={c.ownerName || c.contactPerson} />
            <Row label="Owner Contact" value={c.ownerContact || c.phone} />
            {c.ownerContact2 && <Row label="Owner Contact 2" value={c.ownerContact2} />}
            <Row label="City" value={c.city} />
            <Row label="Site Address" value={c.siteAddress || addr} />
            <Row label="Contact Person" value={c.contactPersonName || c.contactPerson} />
            {c.contactPersonNumber && <Row label="Contact Person Number" value={c.contactPersonNumber} />}
            {c.email && <Row label="Email" value={c.email} />}
            {c.website && <Row label="Website" value={c.website} />}
            {c.products?.length > 0 && <Row label="Products" value={c.products?.join(', ')} />}
            {c.description && <Row label="Description" value={c.description} />}
            {c.googleMapsUrl && <Row label="Maps URL" value={c.googleMapsUrl} mono />}
            <Row
              label="Coordinates"
              value={
                c.latitude !== '' && c.latitude != null ? `${c.latitude}, ${c.longitude}` : ''
              }
              mono
            />
          </dl>
        </div>

        {/* Visit Summary Card */}
        <div className="card p-5 h-fit space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Calendar size={18} />
            </span>
            <h3 className="font-extrabold text-base text-slate-900 font-display">Visit Insights</h3>
          </div>

          <dl>
            <Row label="First Visit" value={fmt(c.firstVisit)} />
            <Row label="Latest Visit" value={fmt(c.lastVisit)} />
            <Row label="Total Visits" value={`${c.visitCount} recorded`} />
          </dl>

          <Link
            to={`/company/${c.id}/visit`}
            className="btn btn-p w-full !py-2.5 shadow-glow-brand"
          >
            <Plus size={15} />
            <span>Record New Visit</span>
          </Link>
        </div>
      </div>

      {/* Comprehensive Visit History */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <h3 className="font-extrabold text-base text-slate-900 font-display">
            Chronological Visit History
          </h3>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
            {c.vs.length} logs
          </span>
        </div>

        {c.vs.length === 0 ? (
          <Empty
            title="No visits recorded"
            text="Log the initial consultation or factory inspection for this account."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {c.vs.map((v) => (
              <div
                key={v.id}
                className="p-5 text-sm flex flex-wrap justify-between gap-4 hover:bg-slate-50/60 transition-colors"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-bold text-slate-900 font-display">
                      {fmt(v.visitDate)}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                      {v.visitType}
                    </span>
                  </div>

                  {(v.whichProductUsing || v.suggestedProduct) && (
                    <div className="grid sm:grid-cols-2 gap-2 text-xs py-2 px-3 bg-slate-50 rounded-xl border border-slate-100 mt-2">
                      {v.whichProductUsing && (
                        <div>
                          <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block">Product Using</span>
                          <span className="font-semibold text-slate-800">{v.whichProductUsing}</span>
                        </div>
                      )}
                      {v.suggestedProduct && (
                        <div>
                          <span className="font-bold text-indigo-500 uppercase tracking-wider text-[10px] block">Suggested Product</span>
                          <span className="font-semibold text-indigo-900">{v.suggestedProduct}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {(v.samplesGiven?.length > 0 || v.samplesGivenOther) && (
                    <div className="text-xs pt-1">
                      <span className="font-bold text-slate-600 mr-2">Samples Given:</span>
                      <div className="inline-flex flex-wrap gap-1 align-middle">
                        {(v.samplesGiven || []).map((sm) => (
                          <span key={sm} className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold">
                            {sm}
                          </span>
                        ))}
                        {v.samplesGivenOther && (
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                            {v.samplesGivenOther}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {v.testingDoneAtSite && (
                    <p className="text-slate-700 text-xs">
                      <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mr-1 block sm:inline">
                        Testing Done at Site:
                      </span>
                      {v.testingDoneAtSite}
                    </p>
                  )}

                  {(v.note || v.meetingNotes) && (
                    <div className="text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs leading-relaxed">
                      <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-0.5">Note:</span>
                      {v.note || v.meetingNotes}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {hasPermission('canEditVisit') && (
                    <button
                      className="ib"
                      title="Edit visit"
                      onClick={() => nav(`/visit/${v.id}/edit`)}
                    >
                      <Pencil size={15} />
                    </button>
                  )}
                  {hasPermission('canEditVisit') && (
                    <button
                      className="ib hover:!text-rose-600 hover:!bg-rose-50"
                      title="Delete visit"
                      onClick={() => setDelV(v)}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Modals */}
      {del && (
        <Confirm
          title="Delete company?"
          text="This permanently removes the company record and all linked visits from this local browser database."
          onNo={() => setDel(false)}
          onYes={async () => {
            try {
              await deleteCompany(c.id);
              toast('Company deleted');
              nav('/companies');
            } catch {
              toast('Delete failed', 'err');
            }
          }}
        />
      )}
      {delV && (
        <Confirm
          title="Delete this visit?"
          text={`The visit log on ${fmt(delV.visitDate)} will be removed. The company profile remains.`}
          onNo={() => setDelV(null)}
          onYes={async () => {
            try {
              await deleteVisit(delV.id);
              toast('Visit deleted');
            } catch {
              toast('Delete failed', 'err');
            }
            setDelV(null);
          }}
        />
      )}
    </div>
  );
}

