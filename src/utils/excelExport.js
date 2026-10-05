/**
 * CSV / Excel Export Utility for Sri Ram Transport
 * Exports JSON array of objects to a UTF-8 BOM CSV file (opens directly in Excel).
 */
export function exportToCSV(filename, rows) {
  if (!rows || !rows.length) {
    alert("No records available to export.");
    return;
  }

  const separator = ',';
  const keys = Object.keys(rows[0]);

  // Include UTF-8 BOM for proper Excel encoding of symbols like ₹ and non-ASCII chars
  let csvContent = '\uFEFF';
  
  // Header row
  csvContent += keys.join(separator) + '\r\n';

  // Data rows
  rows.forEach(row => {
    const line = keys.map(k => {
      let cell = row[k] === null || row[k] === undefined ? '' : String(row[k]);
      cell = cell.replace(/"/g, '""');
      if (cell.search(/("|,|\n|\r)/) >= 0) {
        cell = `"${cell}"`;
      }
      return cell;
    }).join(separator);
    csvContent += line + '\r\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
