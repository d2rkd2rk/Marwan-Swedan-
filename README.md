# Marwan Swedan Academy

Production-oriented cybersecurity portfolio and private course platform.

## Included

- Premium responsive cybersecurity portfolio based on the supplied CV
- GitHub Pages static portfolio mirror
- Next.js application for dynamic hosting
- Registration with name, email, WhatsApp, username and strong password policy
- Secure HttpOnly session cookies and bcrypt password hashing
- Server-side course enrollment and lesson authorization
- Administrator dashboard for user search, WhatsApp contact, course creation and access grants/revocations
- Audit logs and security events
- Server-side 24-hour block policy for suspicious activity reports
- Course-scoped AI assistant
- Official WhatsApp Cloud API adapter for registration notifications
- Database schema and starter courses
- Secure response headers and CI build verification

## Required environment

Copy `.env.example` to your deployment environment and set `DATABASE_URL`, `SESSION_SECRET` and `ADMIN_BOOTSTRAP_SECRET`. AI and WhatsApp variables are optional integrations.

Run `db/schema.sql` against a PostgreSQL database before using accounts or protected courses.

After deployment, bootstrap the administrator using the protected `/api/admin/bootstrap` endpoint with the `x-admin-bootstrap-secret` header and a strong password. The administrator email is `202501259@pua.edu.eg`.

## Architecture

GitHub Pages is used only for the public static mirror. The secure application must run on a server-side platform such as Vercel because authentication, database access, private course authorization, WhatsApp credentials and AI credentials must not be exposed to the browser.

Never commit `.env`, tokens, passwords or provider secrets.
