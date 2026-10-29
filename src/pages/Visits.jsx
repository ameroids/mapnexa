import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Pencil, Trash2, X, Plus, Search, Calendar, Building, Clock, Filter, MapPin } from 'lucide-react';
import { useData } from '../database/useData.js';
import { useAuth } from '../context/AuthContext.jsx';
import { deleteVisit } from '../database/repositories.js';
import { Head, Empty, Loading, MapActions, Confirm, Pager, paginate, useToast } from '../components/ui.jsx';
import { fmt } from '../utils/dates.js';
import { uniq } from './Companies.jsx';

const F0 = { co: '', city: '', state: '', type: '', from: '', to: '' };

export default function Visits() {
  const { visits, byId, rows, loading } = useData();
  const { hasPermission } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [f, setF] = useState(F0);
  const [order, setOrder] = useState('new');
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [del, setDel] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return visits
      .filter((v) => {
        const c = byId[v.companyId];
        if (!c) return false;
        return (
          (!t ||
            [
              c.companyName,
              c.ownerName,
              c.ownerContact,
              c.contactPersonName,
              c.contactPerson,
              c.city,
              v.whichProductUsing,
              v.suggestedProduct,
              (v.samplesGiven || []).join(' '),
              v.testingDoneAtSite,
              v.note,
              v.purpose,
              v.meetingNotes,
              v.productsDiscussed?.join(' '),
            ]
              .join(' ')
              .toLowerCase()
              .includes(t)) &&
          (!f.co || v.companyId === f.co) &&
          (!f.city || c.city === f.city) &&
          (!f.state || c.state === f.state) &&
          (!f.type || v.visitType === f.type) &&
          (!f.from || v.visitDate >= f.from) &&
          (!f.to || v.visitDate <= f.to)
        );
      })
      .sort((a, b) =>
        order === 'new'
          ? b.visitDate.localeCompare(a.visitDate)
          : a.visitDate.localeCompare(b.visitDate)
      );
  }, [visits, byId, q, f, order]);

  if (loading) return <Loading />;
  const set = (k) => (e) => {
    setF({ ...f, [k]: e.target.value });
    setPage(1);
  };
  const pages = Math.max(1, Math.ceil(list.length / size));
  const pg = Math.min(page, pages);
  const active = Object.values(f).filter(Boolean).length + (q ? 1 : 0);

  return (
    <div className="space-y-6">
      <Head
        title="Factory Visits"
        sub={`History of ${list.length} logged visits across client facilities`}
      >
        <Link to="/visit/new" className="btn btn-p shadow-glow-brand">
          <Plus size={15} />
          <span>Record New Visit</span>
        </Link>
      </Head>

      {/* Filter Strip */}
      <div className="card p-3.5 sm:p-4 space-y-3 bg-white shadow-sm border border-slate-200/90">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input !pl-10 !bg-slate-50/70 focus:!bg-white text-xs sm:text-sm"
              placeholder="Search visits, topics, notes, companies…"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <button
            type="button"
            className={`btn !py-2.5 !px-3 sm:hidden relative ${
              filterOpen || active > 0 ? 'bg-indigo-50 border-indigo-300 text-indigo-600' : ''
            }`}
            onClick={() => setFilterOpen(!filterOpen)}
            aria-label="Toggle filters"
          >
            <Filter size={15} />
            {active > 0 && (
              <span className="w-2 h-2 rounded-full bg-indigo-600 absolute top-1 right-1" />
            )}
          </button>
        </div>

        <div className={`${filterOpen ? 'grid' : 'hidden'} sm:grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2 pt-1`}>
          <select
            className="input !py-2 !text-xs bg-slate-50/70"
            value={f.co}
            onChange={set('co')}
            aria-label="Company"
          >
            <option value="">All companies</option>
            {[...rows]
              .sort((a, b) => a.companyName.localeCompare(b.companyName))
              .map((r) => (
                <option key={r.id} value={r.id}>
                  {r.companyName}
                </option>
              ))}
          </select>
          <select
            className="input !py-2 !text-xs bg-slate-50/70"
            value={f.state}
            onChange={set('state')}
            aria-label="State"
          >
            <option value="">All states</option>
            {uniq(rows.map((r) => r.state)).map((i) => (
              <option key={i}>{i}</option>
            ))}
          </select>
          <select
            className="input !py-2 !text-xs bg-slate-50/70"
            value={f.city}
            onChange={set('city')}
            aria-label="City"
          >
            <option value="">All cities</option>
            {uniq(rows.map((r) => r.city)).map((i) => (
              <option key={i}>{i}</option>
            ))}
          </select>
          <select
            className="input !py-2 !text-xs bg-slate-50/70"
            value={f.type}
            onChange={set('type')}
            aria-label="Visit type"
          >
            <option value="">All types</option>
            {['First Visit', 'Follow-up Visit', 'Repeat Visit', 'Business Meeting', 'Other'].map(
              (i) => (
                <option key={i}>{i}</option>
              )
            )}
          </select>
          <input
            type="date"
            className="input !py-2 !text-xs bg-slate-50/70"
            value={f.from}
            onChange={set('from')}
            aria-label="From date"
          />
          <input
            type="date"
            className="input !py-2 !text-xs bg-slate-50/70"
            value={f.to}
            onChange={set('to')}
            aria-label="To date"
          />
          <select
            className="input !py-2 !text-xs font-semibold bg-slate-50/70 col-span-2 sm:col-span-1"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            aria-label="Sort"
          >
            <option value="new">Newest first</option>
            <option value="old">Oldest first</option>
          </select>
        </div>

        {active > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span className="font-semibold text-indigo-600">
              {active} active filter{active > 1 ? 's' : ''} applied
            </span>
            <button
              className="btn !py-1 !px-2.5 !text-xs"
              onClick={() => {
                setF(F0);
                setQ('');
              }}
            >
              <X size={13} />
              Reset filters
            </button>
          </div>
        )}
      </div>

      {/* Visits Content */}
      <div className="space-y-4">
        {list.length === 0 ? (
          <div className="card">
            <Empty
              title="No visits found"
              text="Adjust your search criteria or record a new factory inspection."
            />
          </div>
        ) : (
          <>
            {/* Mobile Visits Card View */}
            <div className="md:hidden space-y-3">
              {paginate(list, pg, size).map((v) => {
                const c = byId[v.companyId] || {};
                return (
                  <div
                    key={v.id}
                    className="card p-4 space-y-3 bg-white shadow-sm border border-slate-200/90 hover:border-indigo-300 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/company/${c.id}`}
                          className="font-bold text-slate-900 hover:text-indigo-600 text-base leading-snug line-clamp-1"
                        >
                          {c.companyName}
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                            {fmt(v.visitDate)}
                          </span>
                          <span>•</span>
                          <span className="font-medium">{v.visitType}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 py-2 px-3 bg-slate-50/80 rounded-xl text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Owner / Contact</span>
                        <span className="font-semibold text-slate-700 truncate block mt-0.5">{c.ownerName || c.contactPerson || '—'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">City</span>
                        <span className="font-semibold text-slate-700 truncate block mt-0.5">{c.city || '—'}</span>
                      </div>
                    </div>

                    {(v.whichProductUsing || v.suggestedProduct) && (
                      <div className="text-xs space-y-1 bg-indigo-50/40 p-2.5 rounded-xl border border-indigo-100/60">
                        {v.whichProductUsing && (
                          <div>
                            <span className="font-bold text-slate-700">Product Using: </span>
                            <span className="text-slate-600">{v.whichProductUsing}</span>
                          </div>
                        )}
                        {v.suggestedProduct && (
                          <div>
                            <span className="font-bold text-indigo-700">Suggested: </span>
                            <span className="text-indigo-900 font-medium">{v.suggestedProduct}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {v.samplesGiven?.length > 0 && (
                      <div className="text-xs">
                        <span className="font-bold text-slate-700 block">Samples Given:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {v.samplesGiven.map((sm) => (
                            <span key={sm} className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-semibold">
                              {sm}
                            </span>
                          ))}
                          {v.samplesGivenOther && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px]">
                              {v.samplesGivenOther}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {v.testingDoneAtSite && (
                      <div className="text-xs">
                        <span className="font-bold text-slate-700 block">Site Testing:</span>
                        <p className="text-slate-600 mt-0.5 line-clamp-2">{v.testingDoneAtSite}</p>
                      </div>
                    )}

                    {(v.note || v.meetingNotes) && (
                      <div className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="font-bold text-slate-700 block text-[11px]">Note / Meeting Notes:</span>
                        <p className="text-slate-600 mt-0.5 italic line-clamp-3">{v.note || v.meetingNotes}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <MapActions c={c} compact />
                      {hasPermission('canEditVisit') && (
                        <div className="flex items-center gap-1.5">
                          <button
                            className="btn !py-1.5 !px-2.5 !text-xs font-semibold"
                            onClick={() => nav(`/visit/${v.id}/edit`)}
                          >
                            <Pencil size={14} />
                            <span>Edit</span>
                          </button>
                          <button
                            className="btn btn-d !py-1.5 !px-2.5 !text-xs"
                            onClick={() => setDel(v)}
                            title="Delete visit"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Visits Table */}
            <div className="hidden md:block card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px]">
                  <thead>
                    <tr>
                      {[
                        'Visit Date',
                        'Company Name',
                        'Product Using',
                        'Suggested Product',
                        'Samples Given',
                        'Site Testing',
                        'Note',
                        'Actions',
                      ].map((h) => (
                        <th key={h} className="th">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginate(list, pg, size).map((v) => {
                      const c = byId[v.companyId] || {};
                      const samples = [...(v.samplesGiven || []), v.samplesGivenOther].filter(Boolean);
                      return (
                        <tr key={v.id} className="hover:bg-indigo-50/30 transition-colors">
                          <td className="td whitespace-nowrap font-mono text-xs font-bold text-slate-900">
                            {fmt(v.visitDate)}
                          </td>
                          <td className="td font-bold">
                            <Link
                              to={`/company/${c.id}`}
                              className="text-slate-900 hover:text-indigo-600 transition-colors"
                            >
                              {c.companyName}
                            </Link>
                            <div className="text-[11px] text-slate-400 font-normal">{c.city}</div>
                          </td>
                          <td className="td text-xs text-slate-700 font-medium">
                            {v.whichProductUsing || <span className="text-slate-300">—</span>}
                          </td>
                          <td className="td text-xs text-indigo-700 font-semibold">
                            {v.suggestedProduct || <span className="text-slate-300">—</span>}
                          </td>
                          <td className="td max-w-[200px]">
                            {samples.length ? (
                              <div className="flex flex-wrap gap-1">
                                {samples.slice(0, 2).map((sm) => (
                                  <span key={sm} className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-semibold border border-amber-200">
                                    {sm}
                                  </span>
                                ))}
                                {samples.length > 2 && (
                                  <span className="text-[10px] text-slate-500 font-bold">
                                    +{samples.length - 2} more
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td
                            className="td max-w-[160px] truncate text-slate-600 text-xs"
                            title={v.testingDoneAtSite}
                          >
                            {v.testingDoneAtSite || <span className="text-slate-300">—</span>}
                          </td>
                          <td
                            className="td max-w-[200px] truncate text-slate-600 text-xs"
                            title={v.note || v.meetingNotes}
                          >
                            {v.note || v.meetingNotes || <span className="text-slate-300">—</span>}
                          </td>
                          <td className="td">
                            <span className="inline-flex items-center gap-1">
                              <MapActions c={c} compact />
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
                                  onClick={() => setDel(v)}
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="card overflow-hidden">
              <Pager
                page={pg}
                pages={pages}
                setPage={setPage}
                size={size}
                setSize={setSize}
                total={list.length}
              />
            </div>
          </>
        )}
      </div>

      {del && (
        <Confirm
          title="Delete visit?"
          text={`The visit recorded on ${fmt(del.visitDate)} will be permanently removed.`}
          onNo={() => setDel(null)}
          onYes={async () => {
            try {
              await deleteVisit(del.id);
              toast('Visit deleted');
            } catch {
              toast('Delete failed', 'err');
            }
            setDel(null);
          }}
        />
      )}
    </div>
  );
}

