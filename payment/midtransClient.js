
import midtransClient from 'midtrans-client';

let snap = new midtransClient.Snap({
    isProduction: false, // Ganti ke true jika sudah live
    serverKey: 'SB-Mid-server-pR556x1VaXnmJQZ9YTE_cxJl',
    clientKey: 'SB-Mid-client-Aniqdi4-3mCKWtB9'
});

export default snap;
