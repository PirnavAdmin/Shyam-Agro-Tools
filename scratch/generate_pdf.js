const { jsPDF } = require('../frontend/node_modules/jspdf');
const fs = require('fs');
const path = require('path');

const doc = new jsPDF({
  orientation: 'landscape',
  unit: 'mm',
  format: 'a4'
});

// Page dimensions
const pageWidth = 297;
const pageHeight = 210;
const marginX = 10;
let startY = 15;

// Header section
doc.setFillColor(22, 101, 52); // #166534
doc.rect(marginX, startY, pageWidth - (2 * marginX), 16, 'F');

doc.setTextColor(255, 255, 255);
doc.setFont('helvetica', 'bold');
doc.setFontSize(15);
doc.text('SHYAM AGRO TOOLS', marginX + 6, startY + 10.5);

doc.setFont('helvetica', 'normal');
doc.setFontSize(10.5);
doc.text('Merged 6-Template Master Submission Set (DLT Approved Syntax)', pageWidth - marginX - 6, startY + 10.5, { align: 'right' });

startY += 22;

// Table Column Configuration
const columns = [
  { header: '#', dataKey: 'id', width: 10, align: 'center' },
  { header: 'Template Key', dataKey: 'key', width: 44 },
  { header: 'Merged Scenarios Covered', dataKey: 'module', width: 42 },
  { header: 'SMS Body Text (Named Variables)', dataKey: 'body', width: 88 },
  { header: 'DLT / Provider Format ({#alp#} / ${var})', dataKey: 'dlt', width: 93 }
];

const data = [
  { id: '1', key: 'AUTHENTICATION_OTP', module: 'Login, Registration, Password Reset', body: 'Your Shyam Agro Tools verification OTP for {Purpose} is {OtpCode}. Valid for 10 minutes. Do not share this OTP.', dlt: 'Dear User, your OTP for {#alp#} to ${var1} is ${var2} . Valid for 10 minutes. Do not share - Shyam Agro Tools' },
  { id: '2', key: 'ORDER_PAYMENT_STATUS', module: 'Order Confirmed/Failed, Payment Success/Failed', body: 'Shyam Agro Tools: Order {OrderRef} {OrderStatus}. Payment Status: {PaymentStatus} (Ref {PaymentRef}, Amount {Currency} {Amount}).', dlt: 'Shyam Agro Tools: Order {#alp#} {#alp#}. Payment Status: {#alp#} (Ref {#alp#}, Amount Rs. {#alp#}).' },
  { id: '3', key: 'DISPATCH_LOGISTICS', module: 'Dispatch Confirmed/Failed, Shipping Updates', body: 'Shyam Agro Tools: Order {OrderRef} dispatch update: {DispatchStatus}. Tracking No: {TrackingNo} via {CourierPartner}.', dlt: 'Shyam Agro Tools: Order {#alp#} dispatch update: {#alp#}. Tracking No: {#alp#} via {#alp#}.' },
  { id: '4', key: 'CANCEL_REFUND_UPDATE', module: 'Booking Cancelled, Refund Initiated/Completed/Failed', body: 'Shyam Agro Tools: Order {OrderRef} cancelled. Refund Status: {RefundStatus} (Ref {RefundId}, Amount {Currency} {Amount}).', dlt: 'Shyam Agro Tools: Order {#alp#} cancelled. Refund Status: {#alp#} (Ref {#alp#}, Amount Rs. {#alp#}).' },
  { id: '5', key: 'DELIVERY_REMINDER', module: 'Out For Delivery, Agent Arrival Notice', body: 'Shyam Agro Tools reminder: Your order {OrderRef} is out for delivery today. Delivery agent contact: {AgentPhone}.', dlt: 'Shyam Agro Tools reminder: Your order {#alp#} is out for delivery today. Delivery agent contact: {#alp#}.' },
  { id: '6', key: 'ACCOUNT_SERVICE_ALERT', module: 'Support Notice, Account Updates, Order Status Alert', body: 'Shyam Agro Tools notice: Regarding your order/account {RefNo} - {MessageDetail}. Support: {SupportPhone}.', dlt: 'Shyam Agro Tools notice: Regarding your order/account {#alp#} - {#alp#}. Support: {#alp#}.' }
];

function drawTableHeader(y) {
  doc.setFillColor(30, 41, 59); // Dark slate header
  let curX = marginX;
  
  columns.forEach(col => {
    doc.rect(curX, y, col.width, 10, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(curX, y, col.width, 10, 'S');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    
    if (col.align === 'center') {
      doc.text(col.header, curX + (col.width / 2), y + 6.8, { align: 'center' });
    } else {
      doc.text(col.header, curX + 3, y + 6.8);
    }
    curX += col.width;
  });
  return y + 10;
}

let currentY = drawTableHeader(startY);

data.forEach((row, index) => {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  // Calculate text wrapping for body and dlt
  const bodyLines = doc.splitTextToSize(row.body, columns[3].width - 6);
  const dltLines = doc.splitTextToSize(row.dlt, columns[4].width - 6);
  const maxLines = Math.max(bodyLines.length, dltLines.length, 1);
  const lineHeight = 5;
  const rowHeight = Math.max(16, (maxLines * lineHeight) + 6);
  
  // Page break check
  if (currentY + rowHeight > pageHeight - 15) {
    doc.addPage();
    currentY = 15;
    currentY = drawTableHeader(currentY);
  }
  
  // Row Background
  if (index % 2 === 1) {
    doc.setFillColor(248, 250, 252);
    doc.rect(marginX, currentY, pageWidth - (2 * marginX), rowHeight, 'F');
  }
  
  // Draw cell borders and contents
  let curX = marginX;
  
  // 1. ID
  doc.setDrawColor(226, 232, 240);
  doc.rect(curX, currentY, columns[0].width, rowHeight, 'S');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(row.id, curX + (columns[0].width / 2), currentY + (rowHeight / 2) + 1.5, { align: 'center' });
  curX += columns[0].width;
  
  // 2. Template Key
  doc.rect(curX, currentY, columns[1].width, rowHeight, 'S');
  doc.setFont('courier', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(row.key, curX + 3, currentY + 8);
  curX += columns[1].width;
  
  // 3. Merged Scenarios
  doc.rect(curX, currentY, columns[2].width, rowHeight, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  const moduleLines = doc.splitTextToSize(row.module, columns[2].width - 6);
  doc.text(moduleLines, curX + 3, currentY + 6);
  curX += columns[2].width;
  
  // 4. SMS Body Text
  doc.rect(curX, currentY, columns[3].width, rowHeight, 'S');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(bodyLines, curX + 3, currentY + 6);
  curX += columns[3].width;
  
  // 5. DLT / Provider Format
  doc.rect(curX, currentY, columns[4].width, rowHeight, 'S');
  doc.setFont('courier', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(dltLines, curX + 3, currentY + 6);
  
  currentY += rowHeight;
});

// Footer
doc.setFont('helvetica', 'italic');
doc.setFontSize(9);
doc.setTextColor(100, 116, 139);
doc.text('Shyam Agro Tools • 6 Consolidated Merged SMS Templates Set (DLT Approval Ready)', pageWidth / 2, pageHeight - 8, { align: 'center' });

const pdfPath = path.join(__dirname, '../Shyam_Agro_Tools_SMS_Templates.pdf');
const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
fs.writeFileSync(pdfPath, pdfBuffer);

console.log('PDF generated successfully at:', pdfPath);
