import { Response } from 'express';

// Convert array of objects to CSV
export function toCSV(data: any[], columns?: { key: string; label: string }[]): string {
  if (data.length === 0) return '';

  const keys = columns ? columns.map(c => c.key) : Object.keys(data[0]);
  const headers = columns ? columns.map(c => c.label) : keys;

  const escapeCSV = (val: any): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = data.map(row =>
    keys.map(key => {
      const val = key.includes('.') ? key.split('.').reduce((o: any, k: string) => o?.[k], row) : row[key];
      return escapeCSV(val);
    }).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

export function sendCSV(res: Response, data: any[], filename: string, columns?: { key: string; label: string }[]) {
  const csv = toCSV(data, columns);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
}

// Generate simple PDF-like text report
export function sendPDFReport(res: Response, title: string, data: any[], columns?: { key: string; label: string }[]) {
  const keys = columns ? columns.map(c => c.key) : (data.length > 0 ? Object.keys(data[0]) : []);
  const headers = columns ? columns.map(c => c.label) : keys;

  let html = `<!DOCTYPE html><html><head><title>${title}</title>
<style>
  body { font-family: Arial, sans-serif; margin: 40px; }
  h1 { color: #1a1a2e; border-bottom: 2px solid #1a1a2e; padding-bottom: 10px; }
  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
  th { background-color: #1a1a2e; color: white; padding: 10px; text-align: left; font-size: 12px; }
  td { padding: 8px 10px; border-bottom: 1px solid #ddd; font-size: 11px; }
  tr:nth-child(even) { background-color: #f5f5f5; }
  .footer { margin-top: 30px; font-size: 10px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
</style></head><body>`;

  html += `<h1>${title}</h1>`;
  html += `<p>Generated: ${new Date().toLocaleString()} | Total Records: ${data.length}</p>`;
  html += '<table><thead><tr>';
  headers.forEach(h => { html += `<th>${h}</th>`; });
  html += '</tr></thead><tbody>';

  data.forEach(row => {
    html += '<tr>';
    keys.forEach(key => {
      const val = key.includes('.') ? key.split('.').reduce((o: any, k: string) => o?.[k], row) : row[key];
      html += `<td>${val !== null && val !== undefined ? String(val) : ''}</td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table>';
  html += `<div class="footer">AI Procurement Management System - Report</div></body></html>`;

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Content-Disposition', `attachment; filename="${title.replace(/\s+/g, '_')}.html"`);
  res.send(html);
}

// Build pagination response
export function paginationMeta(total: number, page: number, limit: number) {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
