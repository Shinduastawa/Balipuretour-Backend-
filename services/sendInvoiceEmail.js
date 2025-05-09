import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { fileURLToPath } from 'url';
import { uploadPDFToCloudinary } from '../config/uploadToCloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Generate PDF dan Upload ke Cloudinary
export const generateInvoicePDF = async (transaction) => {
  const doc = new jsPDF();
  doc.setFont('helvetica');

  // Logo
  const logoPath = path.resolve(__dirname, '../assets/logo/logo.jpg');
  if (fs.existsSync(logoPath)) {
    const imgBuffer = fs.readFileSync(logoPath);
    const imgBase64 = imgBuffer.toString('base64');
    const ext = path.extname(logoPath).slice(1);
    doc.addImage(`data:image/${ext};base64,${imgBase64}`, ext.toUpperCase(), 20, 15, 20, 20);
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  const rightX = pageWidth - 10;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', rightX, 18, null, null, 'right');

  // Badge "PAID"
  const badgeWidth = 30;
  const badgeX = rightX - badgeWidth;
  doc.setFillColor(6, 72, 72);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.rect(badgeX, 22, badgeWidth, 10, 'F');
  doc.text('PAID', rightX - badgeWidth / 2, 29, null, null, 'center');
  doc.setTextColor(0, 0, 0);

  const leftX = 20;
  let y = 50;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Billed To:', leftX, y);
  doc.setFont('helvetica', 'bold');
  doc.text(transaction.full_name, leftX, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(transaction.email, leftX, y + 12);
  doc.text('Invoice Date:', rightX, y, { align: 'right' });
  doc.text(new Date().toLocaleDateString(), rightX, y + 6, { align: 'right' });
  doc.text('Order ID:', rightX, y + 12, { align: 'right' });
  doc.text(transaction.order_id, rightX, y + 18, { align: 'right' });

  // Table isi transaksi
  y += 35;
  autoTable(doc, {
    startY: y,
    head: [['Description', 'Details']],
    body: [
      ['Tour Package', transaction.package_name],
      ['Number of Participants', transaction.num_participants],
      ['Check-In Date', transaction.checkin_date || '-'],
      ['Payment Method', transaction.payment_method],
      ['Total Payment', `Rp ${transaction.total_price.toLocaleString()}`],
    ],
    styles: { fontSize: 10, font: 'helvetica', cellPadding: 4 },
    headStyles: { fillColor: [6, 72, 72], textColor: 255, fontStyle: 'bold' },
  });

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(10);
  doc.text('Terima kasih telah memilih Bali Pure Tour!', leftX, pageHeight - 30);
  doc.setFontSize(8);
  doc.text(
    'This invoice is generated automatically and serves as a valid proof of payment.',
    leftX,
    pageHeight - 22
  );

  // Simpan ke local
  const invoiceDir = path.join(__dirname, '../invoices');
  if (!fs.existsSync(invoiceDir)) fs.mkdirSync(invoiceDir, { recursive: true });

  const invoicePath = path.join(invoiceDir, `invoice-${transaction.id_transaction}.pdf`);
  fs.writeFileSync(invoicePath, Buffer.from(doc.output('arraybuffer')));

  console.log(`📄 Invoice disimpan di: ${invoicePath}`);

  // Upload ke Cloudinary (opsional)
  const cloudinaryUrl = await uploadPDFToCloudinary(invoicePath);
  console.log(`☁️ PDF uploaded to Cloudinary: ${cloudinaryUrl}`);

  return { localPath: invoicePath, cloudinaryUrl };
};

// ✅ Kirim Email dengan Attachment PDF
export const sendInvoiceEmail = async (to, name, localPath) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Bali Pure Tour" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Payment Invoice - Bali Pure Tour',
    html: `
      <p>Hi ${name},</p>
      <p>Thank you for your payment. Attached is your invoice in PDF format.</p>
      <p>✨ Bali Pure Tour ✨</p>
    `,
    attachments: [
      {
        filename: path.basename(localPath),
        path: localPath,
        contentType: 'application/pdf',
      },
    ],
  };

  await transporter.sendMail(mailOptions);
  console.log(`📬 Invoice email sent to ${to} with attachment`);
};
