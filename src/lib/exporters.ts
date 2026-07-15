// APEX SOC Export Utilities

export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(h => {
      const val = String(row[h] ?? '');
      return val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
    }).join(','))
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportViewToPDF(elementId: string, title: string) {
  // Simplified PDF export using print
  const element = document.getElementById(elementId);
  if (!element) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <html>
      <head>
        <title>APEX SOC - ${title}</title>
        <style>
          body { background: #0a0e17; color: #e2e8f0; font-family: monospace; padding: 20px; }
          h1 { color: #00f0ff; font-size: 16px; margin-bottom: 4px; }
          .timestamp { color: #475569; font-size: 11px; margin-bottom: 20px; }
          .classification { color: #475569; font-size: 10px; margin-top: 40px; border-top: 1px solid #1e293b; padding-top: 8px; }
        </style>
      </head>
      <body>
        <h1>APEX SOC — ${title}</h1>
        <div class="timestamp">Generated: ${new Date().toISOString()}</div>
        <pre style="font-size: 10px; line-height: 1.4;">${element.innerText}</pre>
        <div class="classification">CLASSIFICATION: INTERNAL — APEX SOC Threat Intelligence Platform</div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}
