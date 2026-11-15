# RitualOS

RitualOS is a Vite + React single-page app. Supabase is the primary backend for authentication, application data, and public ritual media.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local`.
4. Run the SQL migration in `supabase/migrations/20261115000000_ritualos_schema.sql` from the Supabase SQL Editor.
5. Start the frontend with `npm run dev`.

The Supabase publishable key is intended for browser use. **Never put a Supabase `service_role` or secret key in frontend code, a `VITE_` variable, or a committed file.**

## Supabase project setup

The SQL migration creates the app's tables, row-level security policies, profile trigger, and public `ritual-assets` storage bucket. It does not import records from Base44.

After running the migration:

1. In Supabase Authentication settings, enable email/password sign-in and configure the confirmation and password-reset email templates.
2. If using Google sign-in, configure the Google OAuth provider in Supabase and add the production and local callback URLs to its redirect allow list.
3. Add the production site URL and any preview/local URLs used by auth email redirects to Supabase's allowed redirect URLs.
4. Register your own account, then promote it to admin in the SQL Editor:

   ```sql
   update public.profiles
   set role = 'admin'
   where lower(email) = lower('your-admin-email@example.com');
   ```

Admin permissions are enforced by database row-level security. Never grant admin roles from frontend code.

### Existing Base44 data and users

The app now reads and writes to Supabase. It does not automatically copy Base44 records. Existing rituals, categories, purchases, sessions, favorites, and journal entries remain in Base44 until exported and imported separately. The migration SQL only prepares an empty Supabase schema.

Base44 password hashes and sessions are not transferred to Supabase Auth. Existing users must create/reset their account in Supabase. Review any historical purchases before importing entitlements: the old checkout was a mock flow and did not verify real payment.

## Vercel deployment

In the Vercel project settings, add these environment variables for every environment you use (Production, Preview, and Development as applicable):

- `VITE_SUPABASE_URL` — the Supabase project URL.
- `VITE_SUPABASE_PUBLISHABLE_KEY` — the Supabase publishable key.

Then redeploy so Vite embeds the values in the new build. Do not set or expose a `service_role` key in Vercel frontend variables. The checked-in `vercel.json` rewrites client-side routes, including `/login` and `/reset-password`, to the SPA entry point.

The build command is `npm run build` and the output directory is `dist`.

## Operational limitations

- Paid checkout is intentionally disabled until a server-verified payment provider is integrated; the previous mock checkout did not charge customers.
- Reminder emails are disabled until a server-side email provider/function is configured.
- Multi-factor sign-in is not yet implemented for Supabase; the former MFA handoff was Base44-specific.
