// controllers/razorpayController.js
const Razorpay = require('razorpay');

// This check runs when the server starts. If keys are missing, it will tell you immediately.
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error("\nFATAL ERROR: Razorpay API Key ID or Key Secret is not defined in your .env file.");
    console.error("Please ensure your .env file contains the correct Razorpay credentials.\n");
    // In production, you would exit the process to prevent it from running in a broken state.
    // process.exit(1); 
}

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

function createOrder(req, res, next) {
    const { amount, currency = 'INR', receipt } = req.body;

    if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid or missing amount for payment.' });
    }

    const options = {
        amount: Math.round(amount * 100), // Amount in the smallest currency unit (paise)
        currency,
        receipt
    };

    razorpay.orders.create(options, (err, order) => {
        if (err) {
            // This will now catch any authentication errors from Razorpay.
            console.error("Razorpay Order Creation Error:", err);
            const errorMessage = err.error && err.error.description 
                ? err.error.description 
                : 'Failed to create payment order with Razorpay.';
            
            return res.status(502).json({ error: errorMessage });
        }
        
        // Success
        res.json(order);
    });
}

module.exports = { createOrder };