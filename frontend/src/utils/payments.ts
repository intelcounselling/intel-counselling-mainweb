import { apiClient } from './api';

// Razorpay Standard Checkout, shared by every paid flow (bookings, career test,
// Intel assessments). The server picks the amount; the browser only opens the
// payment window and hands the signed result back for server-side verification.

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

export class PaymentCancelledError extends Error {
  constructor() {
    super('Payment was cancelled.');
    this.name = 'PaymentCancelledError';
  }
}

let scriptPromise: Promise<boolean> | null = null;

function loadCheckout(): Promise<boolean> {
  if ((window as any).Razorpay) return Promise.resolve(true);
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = CHECKOUT_SRC;
      s.async = true;
      s.onload = () => resolve(true);
      s.onerror = () => {
        scriptPromise = null; // allow a retry
        resolve(false);
      };
      document.body.appendChild(s);
    });
  }
  return scriptPromise;
}

export interface PaymentRequest {
  serviceId: string;
  serviceName: string;
  customer: { name?: string | null; email?: string | null; phone?: string | null };
}

// Resolves with our order id once the server has verified the payment.
// Rejects with PaymentCancelledError if the customer closes the window.
export async function payWithRazorpay({ serviceId, serviceName, customer }: PaymentRequest): Promise<string> {
  if (!(await loadCheckout())) {
    throw new Error('Could not load the payment window. Please check your internet connection.');
  }

  const order = await apiClient.post<any>('/api/create-payment-order', {
    serviceId,
    serviceName,
    customerName: customer.name || undefined,
    customerEmail: customer.email || undefined,
    customerPhone: customer.phone || undefined,
  });

  return new Promise<string>((resolve, reject) => {
    let lastFailure: string | null = null;

    const rzp = new (window as any).Razorpay({
      key: order.keyId,
      order_id: order.razorpayOrderId,
      amount: order.amount,
      currency: order.currency,
      name: order.name,
      description: order.description,
      image: '/assets/imgs/logo_small.png',
      prefill: order.prefill,
      theme: { color: '#1C3F39' },
      handler: async (response: any) => {
        try {
          const verified = await apiClient.post<any>('/api/verify-payment', {
            orderId: order.orderId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          if (verified.paid === true) resolve(order.orderId);
          else reject(new Error('We have not received the payment yet. If you were charged, please contact us with order ID ' + order.orderId + '.'));
        } catch (err: any) {
          reject(new Error((err?.message || 'We could not confirm the payment.') + ' If you were charged, please contact us with order ID ' + order.orderId + '.'));
        }
      },
      modal: {
        // Closing the window: report the last failure if there was one, else a cancel
        ondismiss: () => reject(lastFailure ? new Error(lastFailure) : new PaymentCancelledError()),
      },
    });

    // A failed attempt keeps the window open so the customer can retry another method.
    rzp.on('payment.failed', (resp: any) => {
      lastFailure = resp?.error?.description || 'The payment failed. Please try again.';
    });

    rzp.open();
  });
}
