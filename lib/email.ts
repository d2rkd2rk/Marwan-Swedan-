export async function sendEmail(to: string, subject: string, text: string) {
  const key = process.env.RESEND_API_KEY || '';
  const from = process.env.EMAIL_FROM || '';
  if (!key || !from) throw new Error('EMAIL_NOT_CONFIGURED');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [to], subject, text }),
    cache: 'no-store',
  });

  if (!response.ok) {
    console.error('EMAIL_SEND_FAILED', { status: response.status, statusText: response.statusText });
    throw new Error('EMAIL_SEND_FAILED');
  }
  return response.json();
}


export async function sendBulkEmail(recipients: string[], subject: string, text: string) {
  const key = process.env.RESEND_API_KEY || '';
  const from = process.env.EMAIL_FROM || '';
  if (!key || !from) throw new Error('EMAIL_NOT_CONFIGURED');

  let sent = 0;
  let failed = 0;
  for (let offset = 0; offset < recipients.length; offset += 100) {
    const batch = recipients.slice(offset, offset + 100).map(email => ({
      from,
      to: [email],
      subject,
      text,
    }));
    try {
      const response = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batch),
        cache: 'no-store',
      });
      if (!response.ok) {
        failed += batch.length;
        console.error('BULK_EMAIL_BATCH_FAILED', { status: response.status, count: batch.length });
        continue;
      }
      const payload = await response.json();
      if (Array.isArray(payload.data)) {
        const accepted = Math.min(payload.data.length, batch.length);
        sent += accepted;
        failed += batch.length - accepted;
      } else {
        failed += batch.length;
        console.error('BULK_EMAIL_UNEXPECTED_RESPONSE', { count: batch.length });
      }
    } catch (error) {
      failed += batch.length;
      console.error('BULK_EMAIL_BATCH_ERROR', { count: batch.length, message: error instanceof Error ? error.message : 'unknown' });
    }
  }
  return { sent, failed };
}
