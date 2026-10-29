const esc = (v) => { const s = Array.isArray(v) ? v.join('; ') : v == null ? '' : String(v); return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
export const download = (name, text, type) => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name; document.body.appendChild(a); a.click(); a.remove();
};
export const exportCSV = (name, cols, rows) => {
  const body = [cols.map((c) => esc(c[0])).join(','), ...rows.map((r) => cols.map((c) => esc(r[c[1]])).join(','))].join('\r\n');
  download(name, '\ufeff' + body, 'text/csv;charset=utf-8');
};
