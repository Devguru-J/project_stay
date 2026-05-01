# Launch Checklist

## What to Prepare

1. Supabase project
   - Create a new Supabase project.
   - Run `supabase/schema.sql` in the SQL editor.
   - Enable Realtime for `messages`, `room_reactions`, and `message_nods`.
   - Copy the Project URL and anon public key into `.env.local`.

2. Deployment
   - Vercel is the fastest path for this Vite app.
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables.
   - Connect the GitHub repo `Devguru-J/project_stay`.

3. Safety basics
   - Keep messages at 64 characters for now.
   - Keep all entries anonymous.
   - Add a report/hide button before public launch.
   - Add a simple profanity filter or moderation queue before sharing widely.

4. Product polish
   - Replace placeholder pixel SVG scenes with final pixel-art PNG/WebP assets.
   - Decide whether room entries expire after 20 minutes or only messages expire after 24 hours.
   - Add a lightweight empty state when a room has no messages.

## MVP Backend Scope

- Read live messages per room.
- Send anonymous 64-character messages.
- Show room reaction counts.
- Let visitors leave quiet reactions.
- Let visitors nod once per message.
- Hide expired messages after 24 hours.

## Env

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```
