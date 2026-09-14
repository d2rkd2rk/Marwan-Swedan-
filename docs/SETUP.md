# Production setup

## 1. PostgreSQL

Create a PostgreSQL database and run `db/schema.sql` once.

## 2. Vercel

Import this repository as a Next.js project. The repository already passes the GitHub Actions production build.

Required environment variables:

- `DATABASE_URL`
- `SESSION_SECRET` — generate a long random value
- `ADMIN_BOOTSTRAP_SECRET` — generate a separate long random value
- `ADMIN_EMAIL=202501259@pua.edu.eg`

Optional integrations:

- `AI_API_KEY`
- `AI_BASE_URL`
- `AI_MODEL`
- `WHATSAPP_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_GRAPH_VERSION`
- `WHATSAPP_ADMIN_NUMBER`

Never use `NEXT_PUBLIC_` for secrets.

## 3. Bootstrap the administrator

Send a POST request to `/api/admin/bootstrap` with the `x-admin-bootstrap-secret` header and JSON containing `name`, `password`, and `whatsapp`.

The password must be at least 8 characters and include a number and special character.

## 4. Course videos

Store private videos behind a provider that supports private objects or signed URLs. Put the resulting URL in a lesson only after server-side authorization is configured.

## 5. WhatsApp

Use the official WhatsApp Cloud API. The registration notification adapter is disabled until the required credentials are present. Provider policy and user opt-in requirements still apply.

## 6. GitHub Pages

GitHub Pages publishes the static portfolio mirror only. The secure academy uses the Next.js server because GitHub Pages is static hosting and cannot safely run the authentication/database/API layer.
