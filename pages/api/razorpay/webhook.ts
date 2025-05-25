import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.SUPABASE_SECRET ?? "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the raw request body
    const rawBody = JSON.stringify(req.body);
    
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";
    const signature = req.headers['x-razorpay-signature'];

    // Compute HMAC digest using the webhook secret
    const computedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (computedSignature !== signature) {
      console.error('Invalid webhook signature');
      return res.status(400).json({
        error: 'Invalid signature'
      });
    }

    // The event is already parsed as req.body
    const event = req.body;

    // Example: Handle payment captured event
    if (event.event === 'payment.captured') {
      console.log('Payment captured:', event.payload.payment.entity);
      const { data } = await supabase
        .from("users")
        .select("*")
        .match({ email: event.payload.payment.entity.email });
      
      await supabase.from("recharge").insert({
        amount: event.payload.payment.entity.amount / 100,
        user_id: data?.[0]?.id
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({
      error: 'Internal Server Error'
    });
  }
}

// Important: Disable body parsing for webhook signature verification
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}