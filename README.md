# RitualOS

RitualOS is a Vite + React single-page app. Supabase is the primary backend for authentication, application data, and public ritual media.

## Local setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local`.
4. Run the SQL migrations in `supabase/migrations/` in filename order from the Supabase SQL Editor.
5. Start the frontend with `npm run dev`.

The Supabase publishable key is intended for browser use. **Never put a Supabase `service_role` or secret key in frontend code, a `VITE_` variable, or a committed file.**

## Supabase project setup

The SQL migrations create the app's tables, row-level security policies, profile trigger, and public `ritual-assets` storage bucket. The profile-avatar migration permits signed-in users to upload and remove files only inside their own `avatars/<user-id>/` folder. The social-profile-avatar migration stores HTTPS profile photos provided by OAuth metadata on signup and backfills existing profiles with no photo; user-uploaded photos are preserved. The app-branding migration creates public-readable branding settings with admin-only writes. Migrations do not import records from Base44.
The ritual unlock requests migration adds the admin-configurable unlock mode and approval queue. Apply it before enabling **Administrator approval** under Admin → Ritual access. In that mode, users can submit access requests, and only an administrator's approval grants access. The default **Current unlock flow** keeps direct free unlocks; paid checkout remains unavailable until a secure payment provider is integrated.
The admin backup migration adds a restricted, transactional restore function. Apply all migrations before using Backup & restore in the admin database panel.
The legacy import migration adds a separate admin-triggered import for `ritualos-backup` JSON files. It merges categories, rituals, steps, and branding into the live app and stores user-activity rows in a restricted `legacy_import_rows` table. Since historical user IDs do not identify Supabase Auth users, staged data is not visible as user activity until accounts are explicitly mapped. Legacy orders and entitlements are never activated or used to grant access.

After running the migrations:

1. In Supabase Authentication settings, enable email/password sign-in and configure the confirmation and password-reset email templates.
2. Configure Google and/or Facebook OAuth in Supabase Authentication → Sign In / Providers. The Admin → Social sign-in panel provides the project callback URL and controls whether configured providers appear on the login and signup pages. The Client ID and Client Secret must be entered in Supabase, not in this app.
3. Add the production site URL and any preview/local URLs used by auth email redirects to Supabase's allowed redirect URLs.
4. Register your own account, then promote it to admin in the SQL Editor:

   ```sql
   update public.profiles
   set role = 'admin'
   where lower(email) = lower('your-admin-email@example.com');
   ```

Admin permissions are enforced by database row-level security. Never grant admin roles from frontend code.

### Social sign-in setup

The `20261116050000_social_auth_settings.sql` migration creates the public provider-visibility settings row. Only admins can change it. After applying the migration:

1. In Admin → Social sign-in, copy the Supabase callback URL. It has the form `https://<project-ref>.supabase.co/auth/v1/callback`.
2. Create a Google OAuth Web application client. Add your app's exact origin (for example `https://your-domain.example` and `http://localhost:5173`) to **Authorized JavaScript origins**. Add the Supabase callback URL to **Authorized redirect URIs**. In Supabase Authentication → Sign In / Providers → Google, enter the Client ID and Client Secret from this same client and enable the provider.
3. If enabling Facebook, create a Meta app with Facebook Login, add the same callback URL to its valid OAuth redirect URIs, enable the `public_profile` and `email` permissions, and add its App ID and App Secret under Supabase Authentication → Sign In / Providers → Facebook.
4. In Supabase Authentication → URL Configuration, set the production Site URL and allow-list the app's production, preview, and local redirect URLs (for example `https://your-domain.example/**` and `http://localhost:5173/**`). Use only domains you control.
5. Test each provider on the deployed/preview app, including the return destination and a newly created account. Then mark it configured and enable its button in Admin → Social sign-in.

The app never stores provider secrets. Admin's configured checkbox is an operator checklist, not an automatic credential test; mark it only after completing a sign-in test. The app setting controls button visibility only and does not enable the Supabase provider. For troubleshooting, verify the provider's credentials and allowed redirect URLs in the provider and Supabase dashboards. Instagram is not a supported Supabase Auth provider and is therefore not presented as a sign-in option. If Instagram is needed for creator account linking, implement a separate Meta Instagram API integration; it does not authenticate a RitualOS account.

### Admin backups

The admin database panel exports categories, rituals, steps, and user activity to a JSON file (maximum 5 MB and 5,000 rows per collection). The file does not include profiles, authentication data, or secret keys. Restoring imports app content only; activity is not imported or deleted. Merge updates/adds matching content, while Replace removes content absent from the backup; database foreign keys may clear activity references to deleted rituals. Replace downloads a backup of current content before applying the restore.

Keep downloaded backup files private: they contain user activity such as journal notes and completion history. For full disaster recovery—including profiles, authentication users, and storage objects—configure Supabase's managed database backups and storage recovery separately.

### App language translation

The app's preferred interface language is limited to English, Bengali, and Hindi. Translations are bundled as JSON files in `src/locales/` and served with the frontend; there is no translation API, Edge Function, model server, API key, or separate translation hosting to configure. To improve or add a UI translation, edit the matching English phrase in `src/locales/bn.json` or `src/locales/hi.json` and commit the change. English is used whenever a phrase has no translation.

The existing built-in ritual catalog includes bundled Bengali and Hindi translations for ritual names, descriptions, and sources in `src/locales/ritualMetadata.bn.json` and `src/locales/ritualMetadata.hi.json`; these work offline and are selected using the user's preferred interface language. Admin-entered metadata translations override the bundled text. Add translations in Admin → Rituals → Edit Ritual for new or custom rituals, and apply the `20261117100000_ritual_metadata_translations.sql` migration first. These metadata translations are separate from step/mantra translations, which continue to use the ritual player's own language selector. Private journal notes are never translated.

The practice disclaimer shown on each ritual detail page is editable per ritual in Admin → Rituals → Edit Ritual. The English text is prefilled; Bengali and Hindi versions can be authored in the translated details section. Apply `20261117110000_ritual_practice_disclaimer.sql` to add database and backup/restore support. Clearing the disclaimer hides it for that ritual.

No translation service setup or extra deployment step is required.

Edit and commit the locale JSON file for the language you want to update; the frontend deployment publishes it with the rest of the app.

#### Historical translation server setup (not needed)

The following server setup is from the previous translation implementation. Do not follow it; the current frontend uses bundled locale files and does not call a translation server. Translation-cache migrations are retained only as migration history.

No Supabase translation secrets or translation function deployment are required.

The following command is an obsolete example from the previous translation backend; it is not used by the current app and should be ignored.

```sh
export TRANSLATION_SERVICE_URL="https://your-translation-host.example/v1/translate"
export TRANSLATION_SERVICE_API_KEY="your-service-api-key"
curl --fail-with-body "$TRANSLATION_SERVICE_URL" \
  -H "Authorization: Bearer $TRANSLATION_SERVICE_API_KEY" \
  -H "Content-Type: application/json" \
  --data '{"targetLanguage":"hi","texts":["Welcome to your practice."]}'
```

This Edge Function is intentionally callable without a signed-in user to translate public app text. Origin checks are not authentication; the server-to-server bearer key protects the model endpoint, while function-side request validation and rate limits constrain use. Keep the model service protected by HTTPS, monitor its access and resource usage, and do not log submitted text. Translation failures leave the original UI text visible. Google API keys are no longer used.

To import the legacy export in `supabase/all-data.json`, apply all migrations, sign into the app with an admin account, open Admin → Database, choose **Import legacy Base44 data**, select the JSON file, and confirm. The import merges app content and preserves unlinked user activity in the restricted holding table. User accounts/passwords are not included in the export; historic mock checkout rows remain historical only.

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
- External database connection management is not available in the Supabase deployment; the app operates on its configured Supabase project.
