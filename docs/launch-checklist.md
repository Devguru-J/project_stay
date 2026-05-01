# Launch Checklist

## 1. Supabase

1. Create a new Supabase project.
2. Run `supabase/schema.sql` in the SQL editor. It creates:
   - `rooms`, `messages`, `room_reactions`, `message_nods`, `message_reports`
   - RLS policies for `anon` (read/insert only what's needed)
   - Body length check (1–64 chars), visitor/display-name length checks, allowed reaction labels
   - Rate-limit triggers: 1 message / 12s per visitor, 4 reactions / minute per visitor per room
   - `purge_expired()` cleanup function
3. **Realtime**: in the Database → Replication settings, enable Realtime for `messages`, `room_reactions`, `message_nods`.
4. **Cleanup schedule**: enable the `pg_cron` extension and run:
   ```sql
   select cron.schedule('purge-expired', '*/15 * * * *', $$select public.purge_expired();$$);
   ```
   (or call it from an external scheduler — Cloudflare Cron, GitHub Actions, etc.)
5. Copy the Project URL and anon public key into `.env.local`.

## 2. Deployment (Cloudflare Pages)

- Connect the GitHub repo `Devguru-J/project_stay`.
- Framework preset: `None` (Vite static).
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: leave blank.
- Environment variables (Production + Preview):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `NODE_VERSION` = `20` (also pinned via `.nvmrc`)
- SPA routing fallback already handled by `public/_redirects`.

## 3. Safety (already in code)

- Client-side: 12-second send cooldown, Korean profanity/slur blocklist, spam pattern guard (links, emails, phone-like, repeated chars), per-message local `가리기` (hide).
- Server-side: rate-limit triggers + RLS check on body length + `expires_at` filter.
- Database constraints: visitor/display-name length checks, allowed room-reaction labels, nods only for non-expired messages.
- Static headers: `public/_headers` blocks MIME sniffing, framing, and unused browser permissions.
- Soft-moderation queue: anon insert into `message_reports`, no anon read. Admin reviews with the service-role key.
- Privacy modal exposed via `이곳의 약속` link in the manual aside.

## 4. Pre-launch polish

- [x] Add a real share image via `public/og-image.png`.
- [x] Add Open Graph, Twitter card, canonical URL, JSON-LD, `robots.txt`, and `sitemap.xml`.
- [x] Add static security headers via `public/_headers`.
- [x] Add a small manual/usage copy for first-time visitors.
- [x] Add falling quiet-object effect for `작은 사물 놓기`.
- [x] Configure the public domain copy around `https://staytogether.net/`.
- [ ] Self-host Pretendard Variable WOFF2 if CDN dependency should be removed.
- [ ] Add a privacy-respecting analytics layer (Cloudflare Web Analytics or Plausible). No event-level content.
- [ ] Test link previews in KakaoTalk, iMessage, X, Facebook, Discord, and Slack after deploy.

## 5. Google Search

1. Open [Google Search Console](https://search.google.com/search-console/).
2. Add the domain property: `staytogether.net`.
3. Verify ownership through the DNS TXT record Google provides.
4. Submit the sitemap URL: `https://staytogether.net/sitemap.xml`.
5. Use URL Inspection for `https://staytogether.net/` and request indexing.
6. Keep `robots.txt`, canonical URL, Open Graph image, and JSON-LD in sync with the production domain.

## 6. Post-launch monitoring

- Watch the `message_reports` table weekly. If a single `message_id` accumulates reports, soft-delete it with the service role.
- Watch error logs (CF Pages → Functions → Logs, Supabase → Logs).
- If realtime is degrading, check the `messages` table size — `purge_expired()` should keep it under a few thousand rows in normal use.

## 7. Env

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```
