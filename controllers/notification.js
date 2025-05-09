
import Transaction from '../models/TransactionModel.js';
import midtransClient from 'midtrans-client';

let apiClient = new midtransClient.Snap({
    isProduction: false,
    serverKey: 'YOUR_SERVER_KEY',
    clientKey: 'YOUR_CLIENT_KEY'
});

export const handleNotification = async (req, res) => {
    try {
        const statusResponse = await apiClient.transaction.notification(req.body);
        const orderId = statusResponse.order_id;
        const transactionStatus = statusResponse.transaction_status;

        let payment_status;
        if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
            payment_status = 'paid';
        } else if (transactionStatus === 'pending') {
            payment_status = 'pending';
        } else {
            payment_status = 'failed';
        }

        await Transaction.update(
            { payment_status },
            { where: { id_transaction: orderId } }
        );

        res.status(200).json({ message: 'Notification handled successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
