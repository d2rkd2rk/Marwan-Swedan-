# Marwan Swedan Academy

Production-oriented cybersecurity portfolio and private course platform.

## Included

- Premium responsive cybersecurity portfolio based on the supplied CV
- Next.js application for dynamic hosting
- Registration with name, email, WhatsApp, username and strong password policy
- Email verification for new accounts through Resend (single-use links expire after 24 hours)
- Existing accounts remain verified; the protected administrator account is not locked out by verification
- Secure HttpOnly session cookies and bcrypt password hashing
- Email OTP for first login on a device, password reset and password changes
- Server-side course enrollment and lesson authorization
- Administrator dashboard for user search, course creation and access grants/revocations
- Audit logs and security events
- Server-side 24-hour block policy for suspicious activity reports
- Course-scoped AI assistant
- WhatsApp purchase links with prefilled course and current-price messages
- Private course media uploads and authorization
- Database schema and migrations
- Secure response headers and CI build verification

## Required environment

Set `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_BOOTSTRAP_SECRET`, `NEXT_PUBLIC_SITE_URL`, `RESEND_API_KEY` and `EMAIL_FROM` in Vercel. Use a verified sender address from your Resend account for `EMAIL_FROM`.

The email verification migration is safe for existing accounts: it defaults existing users to verified, while new registrations are explicitly unverified. The app also ensures this small schema change at runtime. For a fresh database, run `db/schema.sql` and apply `db/migrations` in order.

The administrator uses a server-protected one-time login-link flow. The generated link is short-lived, single-use and never stored in the repository.

## Course sales flow

There is no payment gateway or WhatsApp bot. A paid course opens the instructor's personal WhatsApp with a ready-made message containing the course name and current price. Payment is arranged directly with the instructor, and course access is granted manually from the administrator dashboard.

## Architecture

The secure application must run on a server-side platform such as Vercel because authentication, database access, private course authorization, media storage, email credentials and AI credentials must not be exposed to the browser.

Never commit `.env`, tokens, passwords or provider secrets.
