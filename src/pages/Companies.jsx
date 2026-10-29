import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  X,
  Search,
  Filter,
  SlidersHorizontal,
  MapPin,
  ChevronDown,
  Building2,
  Phone,
  Calendar,
  LayoutGrid,
  Table as TableIcon
} from 'lucide-react';
import { useData } from '../database/useData.js';
import { useAuth } from '../context/AuthContext.jsx';
import { deleteCompany } from '../database/repositories.js';
import { Head, Badge, Empty, Loading, MapActions, Confirm, Pager, paginate, useToast } from '../components/ui.jsx';
import { fmt } from '../utils/dates.js';

export const INDUSTRIES = [
  'Manufacturing',
  'Engineering',
  'Automobile',
  'Electrical and Electronics',
  'Textiles and Garments',
  'Food Processing',
  'Chemicals',
  'Packaging',
  'Pharmaceuticals',
  'Construction Materials',
  'Furniture and Woodworking',
  'Plastic and Rubber',
  'Metal Fabrication',
  'Other',
];
export const uniq = (a) => [...new Set(a.filter(Boolean))].sort();
const F0 = { industry: '', state: '', city: '', from: '', to: '' };

export default function Companies() {
  const { rows, loading } = useData();
  const { hasPermission } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const [q, setQ] = useState(sp.get('q') || '');
  const [f, setF] = useState(F0);
  const [sort, setSort] = useState('name');
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [del, setDel] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    setQ(sp.get('q') || '');
    setPage(1);
  }, [sp]);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    const r = rows.filter(
      (c) =>
        (!t ||
          [
            c.companyName,
            c.ownerName,
            c.ownerContact,
            c.ownerContact2,
            c.contactPersonName,
            c.contactPersonNumber,
            c.contactPerson,
            c.phone,
            c.siteAddress,
            c.products?.join(' '),
            c.city,
            c.state,
            c.addressLine1,
            c.addressLine2,
            c.pinCode,
          ]
            .join(' ')
            .toLowerCase()
            .includes(t)) &&
        (!f.industry || c.industry === f.industry) &&
        (!f.state || c.state === f.state) &&
        (!f.city || c.city === f.city) &&
        (!f.from || (c.lastVisit && c.lastVisit >= f.from)) &&
        (!f.to || (c.lastVisit && c.lastVisit <= f.to))
    );
    const s = {
      name: (a, b) => a.companyName.localeCompare(b.companyName),
      last: (a, b) => b.lastVisit.localeCompare(a.lastVisit),
      created: (a, b) => b.createdAt.localeCompare(a.createdAt),
      city: (a, b) => (a.city || '').localeCompare(b.city || ''),
    }[sort];
    return r.sort(s);
  }, [rows, q, f, sort]);

  if (loading) return <Loading />;
  const active = Object.values(f).filter(Boolean).length + (q ? 1 : 0);
  const set = (k) => (e) => {
    setF({ ...f, [k]: e.target.value });
    setPage(1);
  };
  const pages = Math.max(1, Math.ceil(list.length / size));
  const pg = Math.min(page, pages);

  return (
    <div className="space-y-6">
      <Head
        title="All Companies"
        sub={`Showing ${list.length} of ${rows.length} verified companies & factories`}
      >
        <Link to="/visit/new" className="btn btn-p shadow-glow-brand">
          <Plus size={15} />
          <span>Add Company / Visit</span>
        </Link>
      </Head>

      {/* Modern Filter Suite */}
      <div className="card p-3.5 sm:p-4 space-y-3 bg-white shadow-sm border border-slate-200/90">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input !pl-10 !bg-slate-50/70 focus:!bg-white text-xs sm:text-sm"
              placeholder="Search companies, contacts, phone, products, city…"
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

        {/* Filter dropdowns - collapse on mobile if toggled off */}
        <div className={`${filterOpen ? 'grid' : 'hidden'} sm:grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2 pt-1`}>
          <select
            className="input !py-2 !text-xs bg-slate-50/70"
            value={f.industry}
            onChange={set('industry')}
            aria-label="Industry"
          >
            <option value="">All industries</option>
            {uniq([...INDUSTRIES, ...rows.map((r) => r.industry)]).map((i) => (
              <option key={i}>{i}</option>
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
          <input
            type="date"
            className="input !py-2 !text-xs bg-slate-50/70"
            value={f.from}
            onChange={set('from')}
            aria-label="Last visit from"
            title="Last visit from"
          />
          <input
            type="date"
            className="input !py-2 !text-xs bg-slate-50/70"
            value={f.to}
            onChange={set('to')}
            aria-label="Last visit to"
            title="Last visit to"
          />
          <select
            className="input !py-2 !text-xs font-semibold bg-slate-50/70 col-span-2 sm:col-span-1"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort"
          >
            <option value="name">Sort: Name</option>
            <option value="last">Sort: Last visit</option>
            <option value="created">Sort: Newest</option>
            <option value="city">Sort: City</option>
          </select>
        </div>

        {active > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span className="font-semibold text-indigo-600">
              {active} filter{active > 1 ? 's' : ''} applied
            </span>
            <button
              className="btn !py-1 !px-2.5 !text-xs"
              onClick={() => {
                setF(F0);
                setQ('');
                setPage(1);
                nav('/companies');
              }}
            >
              <X size={13} />
              Reset filters
            </button>
          </div>
        )}
      </div>

      {/* Companies Content */}
      <div className="space-y-4">
        {rows.length === 0 ? (
          <div className="card">
            <Empty
              title="No companies yet"
              text="Record a visit to add your first company to the directory."
            >
              <Link to="/visit/new" className="btn btn-p">
                Add Visit
              </Link>
            </Empty>
          </div>
        ) : list.length === 0 ? (
          <div className="card">
            <Empty
              title="No matching companies"
              text="Try adjusting your keywords or clearing the active filters."
            />
          </div>
        ) : (
          <>
            {/* Mobile Card View (visible on < md screens) */}
            <div className="md:hidden space-y-3">
              {paginate(list, pg, size).map((c) => (
                <div key={c.id} className="card p-4 space-y-3 bg-white shadow-sm border border-slate-200/90 hover:border-indigo-300 transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/company/${c.id}`}
                        className="font-bold text-slate-900 hover:text-indigo-600 text-base leading-snug line-clamp-1"
                      >
                        {c.companyName}
                      </Link>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <MapPin size={13} className="text-slate-400 shrink-0" />
                        <span className="truncate">{c.city ? `${c.city}, ${c.state}` : c.state || 'Location pending'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 py-2 px-3 bg-slate-50/80 rounded-xl text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Owner</span>
                      <span className="font-semibold text-slate-700 truncate block mt-0.5">{c.ownerName || c.contactPerson || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Owner Contact</span>
                      <span className="font-mono text-slate-700 font-semibold truncate block mt-0.5">{c.ownerContact || c.phone || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Last Visit</span>
                      <span className="font-mono text-slate-600 font-semibold block mt-0.5">{fmt(c.lastVisit)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total Visits</span>
                      <span className="font-bold text-indigo-600 block mt-0.5">{c.visitCount || 0} visits</span>
                    </div>
                  </div>

                  {c.products?.length > 0 && (
                    <div className="text-xs text-slate-500 truncate">
                      <span className="font-semibold text-slate-600">Products: </span>
                      {c.products.join(', ')}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1">
                      <MapActions c={c} compact />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        className="btn !py-1.5 !px-2.5 !text-xs font-semibold"
                        onClick={() => nav(`/company/${c.id}`)}
                      >
                        <Eye size={14} />
                        <span>View</span>
                      </button>
                      {hasPermission('canEditCompany') && (
                        <button
                          className="btn !py-1.5 !px-2.5 !text-xs"
                          onClick={() => nav(`/company/${c.id}/edit`)}
                          title="Edit company"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                      {hasPermission('canDeleteCompany') && (
                        <button
                          className="btn btn-d !py-1.5 !px-2.5 !text-xs"
                          onClick={() => setDel(c)}
                          title="Delete company"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (hidden on mobile, visible on md and up) */}
            <div className="hidden md:block card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px]">
                  <thead>
                    <tr>
                      {[
                        'Company Name',
                        'Owner Name',
                        'Owner Contact',
                        'City',
                        'Site Address',
                        'Contact Person',
                        'Last Visit',
                        'Actions',
                      ].map((h) => (
                        <th key={h} className="th">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginate(list, pg, size).map((c) => (
                      <tr key={c.id} className="hover:bg-indigo-50/30 transition-colors">
                        <td className="td font-bold">
                          <Link
                            to={`/company/${c.id}`}
                            className="text-slate-900 hover:text-indigo-600 transition-colors"
                          >
                            {c.companyName}
                          </Link>
                        </td>
                        <td className="td font-medium text-slate-800">{c.ownerName || c.contactPerson || <span className="text-slate-300">—</span>}</td>
                        <td className="td font-mono text-xs text-slate-600">{c.ownerContact || c.phone || <span className="text-slate-300">—</span>}</td>
                        <td className="td font-medium text-slate-700">{c.city}</td>
                        <td
                          className="td max-w-[200px] truncate text-slate-600 text-xs"
                          title={c.siteAddress || c.addressLine1}
                        >
                          {c.siteAddress || c.addressLine1 || <span className="text-slate-300">—</span>}
                        </td>
                        <td className="td text-xs text-slate-600">
                          {c.contactPersonName || c.contactPerson || <span className="text-slate-300">—</span>}
                        </td>
                        <td className="td font-mono text-xs text-slate-600">{fmt(c.lastVisit)}</td>
                        <td className="td">
                          <span className="inline-flex items-center gap-1">
                            <button
                              className="ib"
                              title="View profile"
                              onClick={() => nav(`/company/${c.id}`)}
                            >
                              <Eye size={15} />
                            </button>
                            <MapActions c={c} compact />
                            {hasPermission('canEditCompany') && (
                              <button
                                className="ib"
                                title="Edit"
                                onClick={() => nav(`/company/${c.id}/edit`)}
                              >
                                <Pencil size={15} />
                              </button>
                            )}
                            {hasPermission('canDeleteCompany') && (
                              <button
                                className="ib hover:!text-rose-600 hover:!bg-rose-50"
                                title="Delete"
                                onClick={() => setDel(c)}
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </span>
                        </td>
                      </tr>
                    ))}
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
          title="Delete company?"
          text={`"${del.companyName}" and its ${del.visitCount} visit record(s) will be permanently removed from this browser.`}
          onNo={() => setDel(null)}
          onYes={async () => {
            try {
              await deleteCompany(del.id);
              toast('Company deleted');
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
