import crypto from 'crypto';

export async function verifySignature(request: Request, secret: string) {
  const signature = request.headers.get('x-signature');
  if (!signature) return false;

  const body = await request.clone().text();
  const hmac = crypto.createHmac('sha256', secret);
  const digest = Buffer.from(hmac.update(body).digest('hex'), 'utf8');
  const signatureBuffer = Buffer.from(signature, 'utf8');
  
  return crypto.timingSafeEqual(digest, signatureBuffer);
}

export type LemonSqueezyWebhookEvent = {
  meta: {
    event_name: 
      | 'subscription_created'
      | 'subscription_updated'
      | 'subscription_cancelled'
      | 'subscription_expired'
      | 'order_created';
  };
  data: {
    id: string;
    attributes: {
      user_email: string;
      status: string;
      renews_at: string;
      ends_at: string | null;
      variant_id: number;
      order_id: number;
    };
  };
};
