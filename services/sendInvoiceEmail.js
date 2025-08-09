import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { fileURLToPath } from 'url';
import { uploadPDFToCloudinary } from '../config/uploadToCloudinary.js';
import logger from "../utils/logger.js";

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
  // === Footer ===
  const finalY = doc.lastAutoTable.finalY || y + 40;

  // Ucapan Terima Kasih
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.text("Thank you for choosing Bali Pure Tour!", leftX, finalY + 10);

  // Info otomatis
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(
    "This invoice is generated automatically and serves as a valid proof of payment.",
    leftX,
    finalY + 16
  );

  // === Info Perusahaan (seperti gambar) ===
  doc.setDrawColor(200);
  doc.line(leftX, finalY + 24, pageWidth - 20, finalY + 24); // garis pemisah

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text("PT. BALI PURE TOUR", pageWidth - 20, finalY + 30, { align: "right" });

  doc.setFont("helvetica", "normal");
  const footerLines = [
    "Office, Operational & Marketing (Mailing Address):",
    "Jl. Melati, Banjar Penempahan, Desa Manukaya, Kecamatan Tampaksiring, Kabupaten Gianyar, Bali 80552",
    "Phone / WA: +62812 4652 5433",
    "www.balipuretour.com | info.balipuretour@gmail.com"
  ];

  footerLines.forEach((line, idx) => {
    doc.text(line, pageWidth - 20, finalY + 36 + (idx * 6), { align: "right" });
  });


  // Simpan ke local
  const invoiceDir = path.join(__dirname, '../invoices');
  if (!fs.existsSync(invoiceDir)) fs.mkdirSync(invoiceDir, { recursive: true });

  const invoicePath = path.join(invoiceDir, `invoice.pdf`);
  fs.writeFileSync(invoicePath, Buffer.from(doc.output('arraybuffer')));

  logger.info(`📄 Invoice disimpan di: ${invoicePath}`);

  // Upload ke Cloudinary (opsional)
  const cloudinaryUrl = await uploadPDFToCloudinary(invoicePath);
  logger.info(`☁️ PDF uploaded to Cloudinary: ${cloudinaryUrl}`);

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
  logger.info(`📬 Invoice email sent to ${to} with attachment`);
};
