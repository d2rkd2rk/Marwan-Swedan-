# Production setup

## 1. PostgreSQL

Create a PostgreSQL database and run `db/schema.sql` once, then run the SQL files in `db/migrations/` in order.

The academy starts empty and playlists are created manually from the administrator console.

## 2. Vercel

Import this repository as a Next.js project.

Required environment variables:

- `DATABASE_URL`
- `SESSION_SECRET` — generate a long random value
- `ADMIN_BOOTSTRAP_SECRET` — generate a separate long random value
- `ADMIN_EMAIL=202501259@pua.edu.eg`
- `NEXT_PUBLIC_SITE_URL`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `BLOB_READ_WRITE_TOKEN` — provided when the Vercel Blob store is connected

For course media, use a private Vercel Blob store. The admin upload flow creates short-lived signed PUT URLs so large videos/files can upload directly from the browser instead of passing through the Next.js function.

## 3. Administrator access

The administrator account is accessed through a server-protected one-time login-link generator. The generated link is valid for 15 minutes and becomes invalid immediately after use. The link token is stored only as a hash in PostgreSQL and is never committed to GitHub.

The fixed administrator identity is:

- Name: `Marwan Swedan`
- Username: `marwan_swedan`
- Email: `202501259@pua.edu.eg`
- WhatsApp: `201515227612`

After entering through the one-time link, change the administrator password from account settings. Password changes require email OTP verification.

## 4. Authentication

The first successful password login from a device requires a 6-digit email OTP. The device is then trusted for 90 days. Normal logins from that trusted device do not ask for OTP again.

Forgot-password and password-change flows require email OTP. OTPs expire after 10 minutes and are limited to five attempts.

Email delivery uses the server-side Resend API. Secrets are kept in the deployment environment and never exposed to the browser.

## 5. Building a playlist

From `/admin`:

1. Create a playlist.
2. Choose `Free` or `Paid`.
3. If paid, set the EGP price.
4. Choose draft or published.
5. Select the playlist and add lessons in order.
6. Upload a video/audio/PDF/archive/document directly from the device, or provide a video URL.
7. Publish the playlist when it is ready.

Paid courses do not use an online payment gateway. The course purchase button opens the instructor's personal WhatsApp with a prefilled message containing the course name and current price. Payment is arranged directly with the instructor, then access is granted manually from the administrator dashboard.

Course media is stored as private content and served through the app's authorization layer rather than exposed as a public file URL.

## 6. Optional AI integration

- `AI_API_KEY`
- `AI_BASE_URL`
- `AI_MODEL`

Never use `NEXT_PUBLIC_` for secrets.
