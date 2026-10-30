import { createContext, useContext, useState, useCallback } from 'react';
import {
  X,
  Inbox,
  MapPin,
  Navigation,
  Copy,
  Pencil,
  Eye,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { viewUrl, dirUrl, openUrl, copyText } from '../utils/googleMaps.js';

const T = createContext(() => {});
export const useToast = () => useContext(T);

export function ToastProvider({ children }) {
  const [l, setL] = useState([]);
  const push = useCallback((msg, type = 'ok') => {
    const id = Math.random();
    setL((x) => [...x, { id, msg, type }]);
    setTimeout(() => setL((x) => x.filter((i) => i.id !== id)), 4000);
  }, []);

  return (
    <T.Provider value={push}>
      {children}
      <div className="fixed bottom-5 right-5 z-[70] space-y-2 pointer-events-none" aria-live="polite">
        {l.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-2xl text-sm font-semibold shadow-2xl backdrop-blur-md border animate-slide-up max-w-sm transition-all ${
              t.type === 'err'
                ? 'bg-rose-950/90 text-rose-100 border-rose-800/80 shadow-rose-950/50'
                : 'bg-slate-900/90 text-white border-slate-700/80 shadow-slate-950/60'
            }`}
          >
            {t.type === 'err' ? (
              <AlertCircle size={18} className="text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            )}
            <span className="flex-1 leading-snug">{t.msg}</span>
          </div>
        ))}
      </div>
    </T.Provider>
  );
}

export function Modal({ title, onClose, children, footer }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian-950/60 backdrop-blur-md p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="card w-full max-w-md p-6 shadow-2xl animate-scale-in border border-slate-200/90 bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
          <h3 className="font-extrabold text-slate-900 text-base font-display">{title}</h3>
          <button className="ib" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="text-sm text-slate-600 leading-relaxed">{children}</div>
        {footer && <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100">{footer}</div>}
      </div>
    </div>
  );
}

export const Confirm = ({ title, text, onYes, onNo, onOk, onCancel, yes = 'Delete' }) => {
  const handleYes = onYes || onOk;
  const handleNo = onNo || onCancel;
  return (
    <Modal
      title={title}
      onClose={handleNo}
      footer={
        <>
          <button className="btn" onClick={handleNo}>
            Cancel
          </button>
          <button className="btn btn-d" onClick={handleYes}>
            {yes}
          </button>
        </>
      }
    >
      {text}
    </Modal>
  );
};

const badgeStyles = {
  Overdue: {
    bg: 'bg-rose-50 text-rose-700 border-rose-200/80',
    dot: 'bg-rose-500 animate-pulse',
  },
  'Due Today': {
    bg: 'bg-amber-50 text-amber-700 border-amber-200/80',
    dot: 'bg-amber-500 animate-pulse',
  },
  'No Date': {
    bg: 'bg-amber-50/80 text-amber-700 border-amber-200/60',
    dot: 'bg-amber-400',
  },
  Upcoming: {
    bg: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    dot: 'bg-indigo-500',
  },
  Completed: {
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    dot: 'bg-emerald-500',
  },
  None: {
    bg: 'bg-slate-100 text-slate-600 border-slate-200/60',
    dot: 'bg-slate-400',
  },
};

export const Badge = ({ s }) => {
  const current = badgeStyles[s] || badgeStyles.None;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap border ${current.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      {s === 'None' ? 'No follow-up' : s}
    </span>
  );
};

export const Empty = ({ title, text, children }) => (
  <div className="text-center py-16 px-4 animate-fade-in">
    <div className="relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-50 to-cyan-50 border border-indigo-100 flex items-center justify-center shadow-sm">
      <Inbox className="text-indigo-500" size={30} />
      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-indigo-400 animate-ping opacity-75" />
    </div>
    <p className="mt-4 font-bold text-slate-800 text-lg font-display">{title}</p>
    <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">{text}</p>
    {children && <div className="mt-5">{children}</div>}
  </div>
);

export const Head = ({ title, sub, children }) => (
  <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
    <div>
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 font-display">
        {title}
      </h1>
      {sub && <p className="text-sm text-slate-500 mt-1 font-medium">{sub}</p>}
    </div>
    <div className="flex gap-2.5 flex-wrap items-center">{children}</div>
  </div>
);

export const Field = ({ label, error, req, children }) => (
  <label className="block space-y-1.5">
    <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
      {label}
      {req && <span className="text-rose-500 ml-0.5">*</span>}
    </span>
    <div>{children}</div>
    {error && <span className="text-xs font-semibold text-rose-600 block">{error}</span>}
  </label>
);

export const Loading = () => (
  <div className="p-16 text-center space-y-3 animate-fade-in">
    <div className="relative inline-flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
    <p className="text-sm font-semibold text-slate-600">Loading factory intelligence data…</p>
  </div>
);

// Location action buttons used across pages
export function MapActions({ c, mode = 'driving', compact }) {
  const toast = useToast();
  const cls = compact ? 'ib' : 'btn';
  return (
    <span className="inline-flex gap-1 items-center">
      <button
        className={cls}
        title="View location in Google Maps"
        onClick={() => openUrl(viewUrl(c), toast)}
      >
        <MapPin size={15} className="text-indigo-600" />
        {!compact && 'View Location'}
      </button>
      <button
        className={cls}
        title="Get directions in Google Maps"
        onClick={() => openUrl(dirUrl(c, mode), toast)}
      >
        <Navigation size={15} className="text-cyan-600" />
        {!compact && 'Get Directions'}
      </button>
      {compact && (
        <button
          className="ib"
          title="Copy Maps link"
          onClick={() => {
            const u = viewUrl(c);
            u ? copyText(u, toast, 'Maps link copied') : toast('No location saved', 'err');
          }}
        >
          <Copy size={15} />
        </button>
      )}
    </span>
  );
}

export const Pager = ({ page, pages, setPage, size, setSize, total }) => (
  <div className="flex flex-wrap items-center justify-between gap-3 p-4 text-xs font-medium text-slate-500 border-t border-slate-100 bg-slate-50/50">
    <span>
      Showing <b className="text-slate-700">{total}</b> result{total === 1 ? '' : 's'}
    </span>
    <div className="flex items-center gap-2.5">
      <select
        className="input !w-auto !py-1 !px-2.5 !text-xs bg-white"
        value={size}
        onChange={(e) => {
          setSize(+e.target.value);
          setPage(1);
        }}
        aria-label="Rows per page"
      >
        {[10, 25, 50].map((n) => (
          <option key={n} value={n}>
            {n} / page
          </option>
        ))}
      </select>
      <button
        className="btn !py-1.5 !px-2.5"
        disabled={page <= 1}
        onClick={() => setPage(page - 1)}
      >
        <ChevronLeft size={14} />
        <span>Prev</span>
      </button>
      <span className="px-2 font-semibold text-slate-700">
        {page} / {pages}
      </span>
      <button
        className="btn !py-1.5 !px-2.5"
        disabled={page >= pages}
        onClick={() => setPage(page + 1)}
      >
        <span>Next</span>
        <ChevronRight size={14} />
      </button>
    </div>
  </div>
);

export const paginate = (arr, page, size) => arr.slice((page - 1) * size, page * size);

