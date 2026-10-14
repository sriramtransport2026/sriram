import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { numberToIndianWords } from './numberToWords';

export function generateInvoicePDF({ 
  invoice, 
  client, 
  trips = [], 
  vehicles = [], 
  companySettings = {}, 
  orientation = 'portrait',
  selectedColumns
}) {
  const isLandscape = orientation === 'landscape';

  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;
  const rightX = pageWidth - margin - 4;

  // Outer border
  doc.setDrawColor(60, 60, 60);
  doc.setLineWidth(0.3);
  doc.rect(margin, margin, contentWidth, isLandscape ? 190 : 273);

  // Top header - Tax Invoice badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setDrawColor(80, 80, 80);
  doc.rect(margin + 4, margin + 4, 28, 6);
  doc.text('TAX INVOICE', margin + 6, margin + 8.2);

  // Right Tax IDs
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(`GST No. : ${companySettings.gstin || '33GUPS2382N1ZF'}`, rightX, margin + 6, { align: 'right' });
  doc.text(`SAC Code : ${companySettings.sac_code || '9965'}`, rightX, margin + 9.5, { align: 'right' });
  doc.text(`Branch State : ${companySettings.branch_state || 'TAMIL NADU'}`, rightX, margin + 13, { align: 'right' });
  doc.text(`PAN No. : ${companySettings.pan || 'GLIPS2382N'}`, rightX, margin + 16.5, { align: 'right' });

  // Center Company Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isLandscape ? 16 : 14);
  doc.setTextColor(30, 45, 107); // Brand Navy
  doc.text(companySettings.company_name || 'Sri Ram Transport', pageWidth / 2, margin + 11, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(50, 50, 50);
  const addressLines = doc.splitTextToSize(`Address: ${companySettings.address || ''}`, isLandscape ? 160 : 110);
  doc.text(addressLines, pageWidth / 2, margin + 15.5, { align: 'center' });
  doc.text(`Email: ${companySettings.email || ''}   Phone: ${companySettings.phone || ''}`, pageWidth / 2, margin + 22.5, { align: 'center' });

  // Divider below header
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.2);
  doc.line(margin, margin + 25, pageWidth - margin, margin + 25);

  // Bill To & Invoice Info Block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text('To,', margin + 4, margin + 30);
  doc.setFontSize(8.5);
  doc.text(client?.name || 'Ashirvad Pipes Pvt Ltd', margin + 4, margin + 34);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(60, 60, 60);
  const clientAddr = doc.splitTextToSize(client?.address || '', isLandscape ? 150 : 105);
  doc.text(clientAddr, margin + 4, margin + 38);

  const gstPanText = `GSTIN : ${client?.gstin || '-'} - PAN : ${client?.pan || '-'} - State : ${client?.state || '-'}`;
  doc.setFont('helvetica', 'bold');
  doc.text(gstPanText, margin + 4, margin + 46);

  // Invoice Number, Date, PO Number on Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text(`Invoice No. : ${invoice.invoice_number}`, rightX, margin + 33, { align: 'right' });
  doc.text(`Date : ${invoice.invoice_date}`, rightX, margin + 37.5, { align: 'right' });
  const poNumToPrint = invoice.po_number || invoice.poNumber || (trips && trips[0]?.po_number) || '—';
  doc.text(`PO No. : ${poNumToPrint}`, rightX, margin + 42, { align: 'right' });

  // Transportation charges sub-bar
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Transportation charges as per detail given below:--', margin + 4, margin + 51);

  // Active columns resolver - po_no is removed from table columns as it is in the header
  const defaultCols = ['sno', 'date', 'lr_no', 'vehicle_no', 'from', 'to', 'qty', 'rate', 'amount', 'total'];
  const activeCols = (selectedColumns && selectedColumns.length > 0) 
    ? selectedColumns.filter(c => c !== 'po_no') 
    : defaultCols;

  // Resolve trips with fallback if empty
  const effectiveTrips = (trips && trips.length > 0)
    ? trips
    : (invoice.trips && invoice.trips.length > 0)
    ? invoice.trips
    : [{
        load_id: invoice.invoice_number || 'CONSIGNMENT-1',
        lr_number: invoice.lr_number || invoice.invoice_number || 'LR-DIR-001',
        loading_date: invoice.invoice_date || new Date().toISOString().split('T')[0],
        vehicle_number: invoice.vehicle_number || '-',
        from_location: invoice.from_location || 'ORIGIN',
        to_location: invoice.to_location || 'DESTINATION',
        packages: invoice.packages || 'Commercial Cargo Freight',
        charged_weight: invoice.charged_weight || '1.00',
        unit_type: 'fixed',
        rate: invoice.sub_total || 0,
        freight_amount: invoice.sub_total || 0,
      }];

  const isAllFixed = effectiveTrips.length > 0 && effectiveTrips.every(t => t.unit_type === 'fixed' || t.rate_type === 'fixed');
  const hasMTFixed = effectiveTrips.some(t => t.unit_type === 'MT-fixed' || t.rate_type === 'MT-fixed');
  const qtyHeaderLabel = isAllFixed ? 'FIXED' : (hasMTFixed ? 'MT / FIXED' : 'MT');

  // Headers matching active columns
  const headerMap = {
    sno: 'SNO',
    date: 'DATE',
    lr_no: 'LRNO',
    vehicle_no: 'VEHICLE NO',
    from: 'FROM',
    to: 'TO',
    packages: 'CARGO / PKGS',
    qty: qtyHeaderLabel,
    rate: 'RATE',
    amount: 'AMOUNT',
    other_charges: 'OTHER CHARGES',
    total: 'TOTAL',
  };

  const headers = activeCols.map(colId => headerMap[colId] || colId.toUpperCase());

  // Table Data Preparation
  const tableRows = effectiveTrips.map((t, index) => {
    const charged = parseFloat(t.charged_weight || t.tons || t.quantity) || 0;
    const rate = parseFloat(t.rate || t.freight_rate) || 0;
    const totalFreight = parseFloat(t.freight_amount) || 0;
    const isFixedUnit = t.unit_type === 'fixed' || t.rate_type === 'fixed';
    const isMTFixed = t.unit_type === 'MT-fixed' || t.rate_type === 'MT-fixed';

    const baseAmount = (isFixedUnit || isMTFixed) 
      ? totalFreight 
      : ((charged > 0 && rate > 0) ? Math.round(charged * rate * 100) / 100 : totalFreight);

    let otherChargesNet = 0;
    if (t.has_loading_unloading === 'yes' && t.loading_unloading_amount) {
      otherChargesNet -= (parseFloat(t.loading_unloading_amount) || 0);
    }
    if (Array.isArray(t.other_charges)) {
      t.other_charges.forEach(c => {
        const a = parseFloat(c.amount) || 0;
        if (c.type === 'add') otherChargesNet += a;
        else if (c.type === 'subtract') otherChargesNet -= a;
      });
    }
    if (otherChargesNet === 0 && Math.abs(totalFreight - baseAmount) > 0.01) {
      otherChargesNet = totalFreight - baseAmount;
    }

    const otherChargesStr = otherChargesNet === 0 
      ? '0.00' 
      : otherChargesNet < 0 
      ? `-${Math.abs(otherChargesNet).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` 
      : `+${otherChargesNet.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    const rateNum = Number(rate || (isFixedUnit || isMTFixed ? totalFreight : 0));
    const rateFormatted = isMTFixed
      ? `${rateNum > 0 ? rateNum.toLocaleString('en-IN') : Number(totalFreight).toLocaleString('en-IN')} (FIXED)`
      : (rateNum > 0 ? rateNum.toLocaleString('en-IN', { minimumFractionDigits: rateNum % 1 === 0 ? 0 : 2 }) : '-');

    const qtyText = isFixedUnit 
      ? 'FIXED' 
      : isMTFixed
      ? `${charged > 0 ? charged.toLocaleString('en-IN', { minimumFractionDigits: charged % 1 === 0 ? 0 : 2 }) : '1.00'} MT`
      : (charged > 0 ? `${charged.toLocaleString('en-IN', { minimumFractionDigits: charged % 1 === 0 ? 0 : 2 })} MT` : '1.00 MT');

    let rawVehNo = t.vehicle?.vehicle_number || t.vehicle_number;
    if (!rawVehNo && t.vehicle_id) {
      const vList = (vehicles && vehicles.length > 0) ? vehicles : (() => {
        try { return JSON.parse(localStorage.getItem('srt_vehicles_v1') || '[]'); } catch(e) { return []; }
      })();
      const found = vList.find(v => v.id === t.vehicle_id);
      if (found) rawVehNo = found.vehicle_number;
    }
    const cleanVehNo = (rawVehNo || '-').replace(/\s*\(.*?\)/g, '');
    const tripPoNo = t.po_number || invoice.po_number || invoice.poNumber || '-';

    const valueMap = {
      sno: index + 1,
      date: t.loading_date || '-',
      lr_no: t.lr_number || t.load_id || '-',
      po_no: tripPoNo,
      vehicle_no: cleanVehNo,
      from: (t.from_location || 'BANGALORE').toUpperCase(),
      to: (t.to_location || '-').toUpperCase(),
      packages: t.packages || t.description || '-',
      qty: qtyText,
      rate: rateFormatted || '-',
      amount: Number(baseAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
      other_charges: otherChargesStr,
      total: Number(totalFreight).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
    };

    return activeCols.map(colId => valueMap[colId] ?? '-');
  });

  // Autotable
  doc.autoTable({
    startY: margin + 53,
    margin: { left: margin, right: margin },
    head: [headers],
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: isLandscape ? 6.8 : 6.0,
      cellPadding: 1.8,
      lineColor: [100, 100, 100],
      lineWidth: 0.15,
      textColor: [30, 30, 30],
    },
    headStyles: {
      fillColor: [245, 246, 248],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
    },
  });

  const finalY = doc.lastAutoTable.finalY || 140;

  // Sub Total & Net Amount Rows
  const subTotalStr = `Rs. ${Number(invoice.sub_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const netAmountStr = `Rs. ${Number(invoice.net_amount || invoice.sub_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const gstAmountStr = `Rs. ${Number(invoice.gst_amount || (invoice.sub_total * 0.05)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  // Summary box
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.2);

  // Sub Total row
  doc.rect(margin, finalY, contentWidth - 40, 6.5);
  doc.rect(margin + contentWidth - 40, finalY, 40, 6.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Sub Total:', margin + contentWidth - 43, finalY + 4.5, { align: 'right' });
  doc.text(subTotalStr, rightX, finalY + 4.5, { align: 'right' });

  // Net Amount row
  doc.rect(margin, finalY + 6.5, contentWidth - 40, 6.5);
  doc.rect(margin + contentWidth - 40, finalY + 6.5, 40, 6.5);
  doc.text('Net Amount:', margin + contentWidth - 43, finalY + 11, { align: 'right' });
  doc.text(netAmountStr, rightX, finalY + 11, { align: 'right' });

  // Amount In Words row
  const wordsY = finalY + 13;
  doc.rect(margin, wordsY, contentWidth, 6.5);
  const words = numberToIndianWords(invoice.net_amount || invoice.sub_total);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(`Amount In Words : ${words}`, margin + 3, wordsY + 4.5);

  // Reverse Charge Row (Only printed if reverse_charge is enabled)
  let nextY = wordsY + 6.5;
  if (invoice.reverse_charge !== false) {
    const rcY = nextY;
    doc.rect(margin, rcY, contentWidth / 2, 6.5);
    doc.rect(margin + contentWidth / 2, rcY, contentWidth / 2, 6.5);
    doc.text('GST is payable on Reverse Charge: Yes', margin + 3, rcY + 4.5);
    doc.text(`Amount of GST subject to Reverse Charge : IGST 5%   ${gstAmountStr}`, margin + contentWidth / 2 + 3, rcY + 4.5);
    nextY = rcY + 6.5;
  }

  // Terms and Conditions
  const termsY = nextY + 3.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('Terms and Conditions :', margin + 3, termsY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('(1) All disputes are subject to Hosur jurisdiction only.', margin + 3, termsY + 3.5);
  doc.text('(2) Payment should be made by Cheque / NEFT / RTGS in favor of Sri Ram Transport.', margin + 3, termsY + 6.8);

  // Official Signatures & Seal Boxes
  let sigBoxY = termsY + 10;
  if (sigBoxY + 28 > (pageHeight - margin)) {
    doc.addPage();
    sigBoxY = margin + 10;
  }

  const sigBoxWidth = (contentWidth - 8) / 3;
  const sigBoxHeight = 24;
  const box1X = margin;
  const box2X = margin + sigBoxWidth + 4;
  const box3X = margin + (sigBoxWidth * 2) + 8;

  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.15);

  // Box 1: Receiver / Consignee
  doc.rect(box1X, sigBoxY, sigBoxWidth, sigBoxHeight);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(90, 90, 90);
  doc.text('CONSIGNEE / RECEIVER', box1X + 4, sigBoxY + 4.5);
  doc.line(box1X + 4, sigBoxY + 18, box1X + sigBoxWidth - 4, sigBoxY + 18);
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(6.5);
  doc.text("Receiver's Signature & Stamp", box1X + (sigBoxWidth / 2), sigBoxY + 21.8, { align: 'center' });

  // Box 2: Verification
  doc.rect(box2X, sigBoxY, sigBoxWidth, sigBoxHeight);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(90, 90, 90);
  doc.text('VERIFICATION', box2X + 4, sigBoxY + 4.5);
  doc.line(box2X + 4, sigBoxY + 18, box2X + sigBoxWidth - 4, sigBoxY + 18);
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(6.5);
  doc.text('Prepared & Checked By', box2X + (sigBoxWidth / 2), sigBoxY + 21.8, { align: 'center' });

  // Box 3: Transport Agency
  doc.rect(box3X, sigBoxY, sigBoxWidth, sigBoxHeight);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(90, 90, 90);
  doc.text(`FOR ${companySettings.company_name?.toUpperCase() || 'SRI RAM TRANSPORT'}`, box3X + sigBoxWidth - 4, sigBoxY + 4, { align: 'right' });
  doc.setFontSize(7);
  doc.setTextColor(10, 34, 64);
  doc.text(companySettings.company_name || 'SRI RAM TRANSPORT', box3X + sigBoxWidth - 4, sigBoxY + 7.5, { align: 'right' });
  doc.line(box3X + 4, sigBoxY + 18, box3X + sigBoxWidth - 4, sigBoxY + 18);
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(6.5);
  doc.text('Authorised Signatory', box3X + sigBoxWidth - 4, sigBoxY + 21.8, { align: 'right' });

  return doc;
}
