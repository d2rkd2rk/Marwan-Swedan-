# Production setup

## 1. PostgreSQL

Create a PostgreSQL database and run `db/schema.sql` once, then run the SQL files in `db/migrations/` in order.

The migration intentionally removes the placeholder courses. The academy starts empty and playlists are created manually from the administrator console.

## 2. Vercel

Import this repository as a Next.js project.

Required environment variables:

- `DATABASE_URL`
- `SESSION_SECRET` — generate a long random value
- `ADMIN_BOOTSTRAP_SECRET` — generate a separate long random value
- `ADMIN_EMAIL=202501259@pua.edu.eg`
- `BLOB_READ_WRITE_TOKEN` — provided when the Vercel Blob store is connected

For course media, use a **private** Vercel Blob store. The admin upload flow creates short-lived signed PUT URLs so large videos/files can upload directly from the browser instead of passing through the Next.js function. Vercel documents direct browser uploads and private Blob storage for authenticated content. citeturn3search0turn3search2

## 3. Bootstrap the administrator

Send a POST request to `/api/admin/bootstrap` with the `x-admin-bootstrap-secret` header and JSON containing `name`, `password`, and `whatsapp`.

The password must be at least 8 characters and include a number and special character.

## 4. Building a playlist

From `/admin`:

1. Create a playlist.
2. Choose `Free` or `Paid`.
3. If paid, set the EGP price.
4. Choose draft or published.
5. Select the playlist and add lessons in order.
6. Upload a video/audio/PDF/archive/document directly from the device, or provide a video URL.
7. Publish the playlist when it is ready.

Course media is stored as private content and served through the app's authorization layer rather than exposed as a public file URL. citeturn3search0turn3search3

## 5. Optional integrations

- `AI_API_KEY`
- `AI_BASE_URL`
- `AI_MODEL`
- `WHATSAPP_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_GRAPH_VERSION`
- `WHATSAPP_ADMIN_NUMBER`

Never use `NEXT_PUBLIC_` for secrets.

## 6. WhatsApp

Use the official WhatsApp Cloud API. The registration notification adapter is disabled until the required credentials are present. Provider policy and user opt-in requirements still apply.

## 7. GitHub Pages

GitHub Pages publishes the static portfolio mirror only. The secure academy uses the Next.js server because GitHub Pages is static hosting and cannot safely run the authentication/database/API layer.
