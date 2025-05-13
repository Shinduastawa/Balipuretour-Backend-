import midtransClient from 'midtrans-client';
import dotenv from 'dotenv';

dotenv.config();

let snap = new midtransClient.Snap({
  isProduction: true, // Ganti ke false saat development
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

export default snap;
