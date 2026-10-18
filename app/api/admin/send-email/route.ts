import {NextResponse} from 'next/server';
import db from '@/lib/db';
import {adminEmail,requireAdmin} from '@/lib/auth';
import {audit} from '@/lib/security';
import {sendBulkEmail} from '@/lib/email';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const rawRecipientIds: unknown[] = Array.isArray(body.recipientIds) ? body.recipientIds : [];
    const recipientIds: string[] = [...new Set<string>(rawRecipientIds.map(id => String(id)))];
    const subject = String(body.subject || '').trim();
    const message = String(body.message || '').trim();

    if (!recipientIds.length) return NextResponse.json({error: 'Select at least one recipient.'}, {status: 400});
    if (recipientIds.some((id: string) => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))) {
      return NextResponse.json({error: 'One or more recipients are invalid.'}, {status: 400});
    }
    if (!subject || subject.length > 200) return NextResponse.json({error: 'Subject is required and must be 200 characters or fewer.'}, {status: 400});
    if (!message || message.length > 10000) return NextResponse.json({error: 'Message is required and must be 10,000 characters or fewer.'}, {status: 400});

    const excludedEmail = String(adminEmail).toLowerCase();
    const recipients = await db`select id,email from users
      where id = any(${db.array(recipientIds, 2950)})
        and lower(email) <> lower(${excludedEmail})
        and coalesce(role,'student') <> 'admin'
      order by created_at desc`;
    if (recipients.length !== recipientIds.length) {
      return NextResponse.json({error: 'Some selected recipients are unavailable. Refresh the list and try again.'}, {status: 400});
    }

    const result = await sendBulkEmail(recipients.map((user: any) => String(user.email)), subject, message);
    await audit(admin.id, 'send_admin_email', request, {recipientCount: recipients.length, sent: result.sent, failed: result.failed, subject});
    return NextResponse.json({ok: result.failed === 0, recipients: recipients.length, ...result});
  } catch (error: any) {
    console.error('ADMIN_EMAIL_SEND_FAILED', {message: error instanceof Error ? error.message : 'unknown'});
    const forbidden = error?.message === 'FORBIDDEN';
    const notConfigured = error?.message === 'EMAIL_NOT_CONFIGURED';
    return NextResponse.json({
      error: forbidden ? 'Forbidden' : notConfigured ? 'Email delivery is not configured on the server.' : 'Could not send the email.',
    }, {status: forbidden ? 403 : notConfigured ? 503 : 401});
  }
}
