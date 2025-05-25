import Razorpay from 'razorpay';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, currency = 'INR' } = req.body;

    if (!amount || isNaN(amount)) {
      return res.status(400).json({
        error: 'Valid amount is required'
      });
    }

    // Initialize Razorpay instance with credentials from env
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Create order options; note that amount should be in paise.
    const options = {
      amount: parseFloat(amount) * 100,
      currency,
      receipt: `receipt_order_${Date.now()}`,
      payment_capture: 1, // Auto-capture payment
    };

    const order = await instance.orders.create(options);
    return res.status(200).json(order);
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return res.status(500).json({
      error: error.message
    });
  }
}