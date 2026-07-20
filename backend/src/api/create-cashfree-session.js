import crypto from 'crypto';

export default async function handler(req, res) {
  // Handle CORS preflight requests for local development (Vercel doesn't strictly need this but good practice)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { amount, serviceName, customerName, customerEmail, customerPhone } = req.body;

    const orderId = 'ORDER_' + crypto.randomBytes(8).toString('hex');
    const cashfreeOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': process.env.CASHFREE_APP_ID,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY,
      },
      body: JSON.stringify({
        order_amount: amount, 
        order_currency: 'INR',
        order_id: orderId,
        customer_details: {
          customer_id: 'CUST_' + Date.now().toString().slice(-6),
          customer_name: customerName || 'John Doe',
          customer_email: customerEmail || 'johndoe@example.com',
          customer_phone: customerPhone || '9999999999',
        },
        order_meta: {
          // Vercel dynamically assigns HTTPs urls. We construct a dynamic HTTPS absolute URL.
          return_url: `https://${req.headers.host}/?order_id={order_id}`,
        },
        order_note: `Payment for ${serviceName || 'Consultation'}`
      }),
    };

    // Use Live Cashfree API Endpoint
    const response = await fetch('https://api.cashfree.com/pg/orders', cashfreeOptions);
    const data = await response.json();

    if (response.ok) {
        res.status(200).json({ paymentSessionId: data.payment_session_id, orderId: data.order_id });
    } else {
        res.status(400).json({ error: data.message || 'Failed to create Cashfree order' });
    }
  } catch (error) {
    console.error('Error creating cashfree session:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
