import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { numberToIndianWords } from './numberToWords';

export function generateInvoicePDF({ invoice, client, trips, companySettings }) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  // Outer border
  doc.setDrawColor(60, 60, 60);
  doc.setLineWidth(0.3);
  doc.rect(margin, margin, contentWidth, 273);

  // Top header - Tax Invoice badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setDrawColor(80, 80, 80);
  doc.rect(margin + 4, margin + 4, 28, 6);
  doc.text('TAX INVOICE', margin + 6, margin + 8.2);

  // Right Tax IDs
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  const rightX = pageWidth - margin - 4;
  doc.text(`GST No. : ${companySettings.gstin || '33GUPS2382N1ZF'}`, rightX, margin + 6, { align: 'right' });
  doc.text(`SAC Code : ${companySettings.sac_code || '9965'}`, rightX, margin + 9.5, { align: 'right' });
  doc.text(`Branch State : ${companySettings.branch_state || 'TAMIL NADU'}`, rightX, margin + 13, { align: 'right' });
  doc.text(`PAN No. : ${companySettings.pan || 'GLIPS2382N'}`, rightX, margin + 16.5, { align: 'right' });

  // Center Company Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(30, 45, 107); // Brand Navy
  doc.text(companySettings.company_name || 'Sri Ram Transport', pageWidth / 2, margin + 12, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(50, 50, 50);
  const addressLines = doc.splitTextToSize(`Address: ${companySettings.address || ''}`, 110);
  doc.text(addressLines, pageWidth / 2, margin + 16.5, { align: 'center' });
  doc.text(`Email: ${companySettings.email || ''}   Phone: ${companySettings.phone || ''}`, pageWidth / 2, margin + 23.5, { align: 'center' });

  // Divider below header
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.2);
  doc.line(margin, margin + 26, pageWidth - margin, margin + 26);

  // Bill To & Invoice Info Block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text('To,', margin + 4, margin + 31);
  doc.setFontSize(8.5);
  doc.text(client?.name || 'Ashirvad Pipes Pvt Ltd', margin + 4, margin + 35);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(60, 60, 60);
  const clientAddr = doc.splitTextToSize(client?.address || '', 105);
  doc.text(clientAddr, margin + 4, margin + 39);

  const gstPanText = `GSTIN : ${client?.gstin || '-'} - PAN : ${client?.pan || '-'} - State : ${client?.state || '-'}`;
  doc.setFont('helvetica', 'bold');
  doc.text(gstPanText, margin + 4, margin + 48);

  // Invoice Number and Date on Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text(`Invoice No. : ${invoice.invoice_number}`, rightX, margin + 35, { align: 'right' });
  doc.text(`Date : ${invoice.invoice_date}`, rightX, margin + 40, { align: 'right' });

  // Transportation charges sub-bar
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Transportation charges as per detail given below:--', margin + 4, margin + 53);

  // Table Data Preparation
  const tableRows = (trips || []).map((t, index) => {
    const charged = parseFloat(t.charged_weight) || 0;
    const rate = parseFloat(t.rate) || 0;
    const totalFreight = parseFloat(t.freight_amount) || 0;
    const baseAmount = (charged > 0 && rate > 0) ? Math.round(charged * rate * 100) / 100 : totalFreight;

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

    return [
      index + 1,
      t.loading_date || '-',
      t.lr_number || t.load_id || '-',
      t.vehicle?.vehicle_number || '-',
      (t.from_location || 'BANGALORE').toUpperCase(),
      (t.to_location || '-').toUpperCase(),
      rate > 0 ? Number(rate).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-',
      Number(baseAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
      otherChargesStr,
      Number(totalFreight).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
    ];
  });

  // Autotable: EXACT SNO, DATE, LRNO, VEHICLE NO, FROM, TO, RATE, AMOUNT, OTHER CHARGES, TOTAL
  doc.autoTable({
    startY: margin + 55,
    margin: { left: margin, right: margin },
    head: [[
      'SNO',
      'DATE',
      'LRNO',
      'VEHICLE NO',
      'FROM',
      'TO',
      'RATE',
      'AMOUNT',
      'OTHER CHARGES',
      'TOTAL'
    ]],
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: 6.2,
      cellPadding: 2,
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
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 18 },
      2: { halign: 'center', cellWidth: 18 },
      3: { halign: 'center', cellWidth: 22 },
      4: { cellWidth: 24 },
      5: { cellWidth: 24 },
      6: { halign: 'right', cellWidth: 18 },
      7: { halign: 'right', cellWidth: 19 },
      8: { halign: 'right', cellWidth: 19 },
      9: { halign: 'right', cellWidth: 18 },
    },
  });

  const finalY = doc.lastAutoTable.finalY || 160;

  // Sub Total & Net Amount Rows
  const subTotalStr = `Rs. ${Number(invoice.sub_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const netAmountStr = `Rs. ${Number(invoice.net_amount || invoice.sub_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const gstAmountStr = `Rs. ${Number(invoice.gst_amount || (invoice.sub_total * 0.05)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  // Summary box
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.2);

  // Sub Total row
  doc.rect(margin, finalY, contentWidth - 36, 7);
  doc.rect(margin + contentWidth - 36, finalY, 36, 7);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('Sub Total:', margin + contentWidth - 40, finalY + 4.8, { align: 'right' });
  doc.text(subTotalStr, rightX, finalY + 4.8, { align: 'right' });

  // Net Amount row
  doc.rect(margin, finalY + 7, contentWidth - 36, 7);
  doc.rect(margin + contentWidth - 36, finalY + 7, 36, 7);
  doc.text('Net Amount:', margin + contentWidth - 40, finalY + 11.8, { align: 'right' });
  doc.text(netAmountStr, rightX, finalY + 11.8, { align: 'right' });

  // Amount In Words row
  const wordsY = finalY + 14;
  doc.rect(margin, wordsY, contentWidth, 7);
  const words = numberToIndianWords(invoice.net_amount || invoice.sub_total);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(`Amount In Words : ${words}`, margin + 3, wordsY + 4.8);

  // Reverse Charge Row
  const rcY = wordsY + 7;
  doc.rect(margin, rcY, contentWidth / 2, 7);
  doc.rect(margin + contentWidth / 2, rcY, contentWidth / 2, 7);
  doc.text('GST is payable on Reverse Charge: Yes', margin + 3, rcY + 4.8);
  doc.text(`Amount of GST subject to Reverse Charge : IGST 5%   ${gstAmountStr}`, margin + contentWidth / 2 + 3, rcY + 4.8);

  // Terms and Conditions
  const termsY = rcY + 11;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('Terms and Conditions :', margin + 3, termsY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('(1) All disputes are subject to Hosur jurisdiction only.', margin + 3, termsY + 3.8);
  doc.text('(2) Payment should be made by Cheque / NEFT / RTGS in favor of Sri Ram Transport.', margin + 3, termsY + 7.2);

  // Generous Official Signatures & Seal Boxes (Ample space for rubber stamp & pen signing)
  let sigBoxY = termsY + 11;
  if (sigBoxY + 30 > 282) {
    doc.addPage();
    sigBoxY = margin + 15;
  }

  const sigBoxWidth = (contentWidth - 8) / 3;
  const sigBoxHeight = 26;
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
  doc.line(box1X + 4, sigBoxY + 20, box1X + sigBoxWidth - 4, sigBoxY + 20);
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(6.5);
  doc.text("Receiver's Signature & Stamp", box1X + (sigBoxWidth / 2), sigBoxY + 23.8, { align: 'center' });

  // Box 2: Verification
  doc.rect(box2X, sigBoxY, sigBoxWidth, sigBoxHeight);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(90, 90, 90);
  doc.text('VERIFICATION', box2X + 4, sigBoxY + 4.5);
  doc.line(box2X + 4, sigBoxY + 20, box2X + sigBoxWidth - 4, sigBoxY + 20);
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(6.5);
  doc.text('Prepared & Checked By', box2X + (sigBoxWidth / 2), sigBoxY + 23.8, { align: 'center' });

  // Box 3: Transport Agency
  doc.rect(box3X, sigBoxY, sigBoxWidth, sigBoxHeight);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(90, 90, 90);
  doc.text('FOR SRI RAM TRANSPORT', box3X + sigBoxWidth - 4, sigBoxY + 4, { align: 'right' });
  doc.setFontSize(7);
  doc.setTextColor(10, 34, 64);
  doc.text('SRI RAM TRANSPORT', box3X + sigBoxWidth - 4, sigBoxY + 7.5, { align: 'right' });
  doc.line(box3X + 4, sigBoxY + 20, box3X + sigBoxWidth - 4, sigBoxY + 20);
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(6.5);
  doc.text('Authorised Signatory', box3X + sigBoxWidth - 4, sigBoxY + 23.8, { align: 'right' });

  // Page Indicator
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(140, 140, 140);
  doc.text('Page 1 of 1', rightX, sigBoxY + sigBoxHeight + 4, { align: 'right' });

  return doc;
}
