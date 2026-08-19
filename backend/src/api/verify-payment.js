export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { orderId } = req.body;

    if (!orderId || typeof orderId !== 'string' || !/^ORDER_[a-f0-9]+$/.test(orderId)) {
      return res.status(400).json({ error: 'Invalid orderId' });
    }

    const response = await fetch(`https://api.cashfree.com/pg/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'x-api-version': '2023-08-01',
        'x-client-id': process.env.CASHFREE_APP_ID,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Cashfree order lookup failed:', response.status, data);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    res.status(200).json({
      paid: data.order_status === 'PAID',
      orderAmount: data.order_amount,
      orderStatus: data.order_status,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
