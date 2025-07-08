const Razorpay = require('razorpay');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

function createOrder(req, res) {
    const { amount, currency = 'INR', receipt } = req.body;
    razorpay.orders.create({ amount: Math.round(amount * 100), currency, receipt }, (err, order) => {
        if (err) return res.status(500).json({ error: 'Razorpay order creation failed' });
        res.json(order);
    });
}

module.exports = { createOrder }; 