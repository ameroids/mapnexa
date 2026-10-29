import { useState } from 'react';
import { Download, Calendar, Filter, Sparkles, FileSpreadsheet } from 'lucide-react';
import { useData } from '../database/useData.js';
import { Head, Loading } from '../components/ui.jsx';
import { BarBox, countBy } from '../components/Charts.jsx';
import { lastMonths, monthLabel } from '../utils/dates.js';
import { exportCSV } from '../utils/csv.js';
import { hasLocation } from '../utils/googleMaps.js';

const CCOLS = [
  ['Company Name', 'companyName'],
  ['Owner Name', 'ownerName'],
  ['Owner Contact Number', 'ownerContact'],
  ['Owner Contact 2', 'ownerContact2'],
  ['City', 'city'],
  ['Site Address', 'siteAddress'],
  ['Contact Person Name', 'contactPersonName'],
  ['Contact Person Number', 'contactPersonNumber'],
  ['Maps URL', 'googleMapsUrl'],
  ['Latitude', 'latitude'],
  ['Longitude', 'longitude'],
  ['Last visit', 'lastVisit'],
  ['Visits', 'visitCount'],
];

export default function Reports() {
  const { rows, visits, byId, loading } = useData();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  if (loading) return <Loading />;

  const vs = visits.filter(
    (v) => byId[v.companyId] && (!from || v.visitDate >= from) && (!to || v.visitDate <= to)
  );
  const cs = rows.filter(
    (c) => (!from || c.createdAt.slice(0, 10) >= from) && (!to || c.createdAt.slice(0, 10) <= to)
  );
  const months = lastMonths(12);
  const freq = rows
    .map((c) => ({
      name: c.companyName,
      value: c.vs.filter((v) => vs.includes(v)).length,
    }))
    .filter((x) => x.value)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const withLoc = rows.filter(hasLocation).length;

  return (
    <div className="space-y-6">
      <Head
        title="Analytics & Data Intelligence"
        sub="Comprehensive reporting, trends, and CSV dataset exports"
      >
        <button
          className="btn"
          onClick={() => exportCSV('companies-all.csv', CCOLS, rows)}
        >
          <FileSpreadsheet size={15} className="text-indigo-600" />
          <span>All Companies</span>
        </button>
        <button
          className="btn"
          onClick={() => exportCSV('companies-filtered.csv', CCOLS, cs)}
        >
          <Download size={15} />
          <span>Filtered ({cs.length})</span>
        </button>
        <button
          className="btn"
          onClick={() =>
            exportCSV(
              'visits.csv',
              [
                ['Date', 'visitDate'],
                ['Company Name', 'co'],
                ['City', 'city'],
                ['Which Product Using', 'whichProductUsing'],
                ['Suggested Product', 'suggestedProduct'],
                ['Samples Given', 'samplesGivenText'],
                ['Testing Done at Site', 'testingDoneAtSite'],
                ['Note', 'note'],
              ],
              vs.map((v) => ({
                ...v,
                co: byId[v.companyId]?.companyName || '',
                city: byId[v.companyId]?.city || '',
                samplesGivenText: [...(v.samplesGiven || []), v.samplesGivenOther].filter(Boolean).join(', '),
                note: v.note || v.meetingNotes || '',
              }))
            )
          }
        >
          <FileSpreadsheet size={15} className="text-emerald-600" />
          <span>Visits Log</span>
        </button>
      </Head>

      {/* Date Range Filter Banner */}
      <div className="card p-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600 bg-white">
        <span className="flex items-center gap-1.5 text-slate-800">
          <Calendar size={15} className="text-indigo-600" />
          <span>Filter Date Range:</span>
        </span>
        <input
          type="date"
          className="input !w-auto !py-1.5 !px-2.5 bg-slate-50"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          aria-label="From"
        />
        <span>to</span>
        <input
          type="date"
          className="input !w-auto !py-1.5 !px-2.5 bg-slate-50"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          aria-label="To"
        />
        {(from || to) && (
          <button
            className="btn !py-1 !px-2.5"
            onClick={() => {
              setFrom('');
              setTo('');
            }}
          >
            Clear Range
          </button>
        )}
        <span className="sm:ml-auto px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
          {vs.length} visits · {cs.length} companies within range
        </span>
      </div>

      {/* Analytics Visual Grid */}
      <div className="grid lg:grid-cols-2 gap-5">
        <BarBox
          title="Visits by Month (12-Month Timeline)"
          data={months.map((k) => ({
            name: monthLabel(k),
            value: vs.filter((v) => v.visitDate.startsWith(k)).length,
          }))}
          color="#4F46E5"
        />
        <BarBox
          title="New Companies Added by Month"
          data={months.map((k) => ({
            name: monthLabel(k),
            value: cs.filter((c) => c.createdAt.startsWith(k)).length,
          }))}
          color="#F59E0B"
        />
        <BarBox
          title="Visits by State Distribution"
          data={countBy(vs, (v) => byId[v.companyId].state, 10)}
          horizontal
          color="#4F46E5"
        />
        <BarBox
          title="Top Cities by Factory Visits"
          data={countBy(vs, (v) => byId[v.companyId].city, 10)}
          horizontal
          color="#0F172A"
        />
        <BarBox
          title="Visits by Industry Category"
          data={countBy(vs, (v) => byId[v.companyId].industry, 10)}
          horizontal
          color="#F59E0B"
        />
        <BarBox
          title="Most Frequently Visited Companies"
          data={freq}
          horizontal
          color="#4F46E5"
        />
        <BarBox
          title="Geographical Coordinates Completeness"
          data={[
            { name: 'With GPS Pin', value: withLoc },
            { name: 'Needs Coordinates', value: rows.length - withLoc },
          ]}
          color="#0F172A"
        />
      </div>
    </div>
  );
}

