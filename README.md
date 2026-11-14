# Base44 Project

Use this repository to run and edit the app locally, then publish changes back through Base44.

Any change pushed to the repo will also be reflected in the Base44 Builder.

## Prerequisites

1. Clone the repository using the project's Git URL.
2. Navigate to the project directory.
3. Install dependencies: `npm install`.
4. Install the Base44 CLI: `npm install -g base44@latest`.
5. Install [Deno](https://docs.deno.com/runtime/getting_started/installation/) — the local Base44 backend runs on it.

Run `base44 --help` (or see the [CLI reference](https://docs.base44.com/developers/references/cli/commands/introduction)) for the full command surface.

## Run Locally

Three commands, from the project root:

```bash
base44 login   # one-time per machine
base44 link    # one-time per clone
base44 dev     # local backend + frontend together
```

Open the frontend URL that `base44 dev` prints (typically `http://localhost:5173`).

Notes:

- **Every fresh clone needs `base44 link`.** It writes `base44/.app.jsonc` (the app-id pointer), which is deliberately gitignored. Your app id is in the Builder URL (`app.base44.com/apps/<id>/...`); `base44 link --help` shows the non-interactive flags.
- **`base44 dev` runs the frontend for you** (via `site.serveCommand` in this repo's `base44/config.jsonc`) — never run `npm run dev` yourself: alone it serves a UI with no backend behind it (`[base44] Proxy not enabled`, every `/api` call fails), and alongside `base44 dev` the second Vite silently takes the next port and you end up looking at the wrong one.
- **The app must be published at least once for the UI to load under `base44 dev`.** The frontend boots by fetching app settings from the hosted app; before the first publish that fails and every page redirects to login. The local API works regardless.
- Entities, functions, and auth run locally — entity data is **in-memory only**, wiped when `base44 dev` restarts. Everything else (Core integrations, OAuth login) is forwarded to your deployed app. Full breakdown: [Local development overview](https://docs.base44.com/developers/backend/overview/local-dev/local-development-overview).

### Run a local-only UI demo (no Base44 account required)

This checkout includes a local demo admin identity and sample rituals for manually testing the UI without a Base44 app or CLI. From the project root:

```bash
npm run dev -- --host 127.0.0.1
```

Open the local URL printed by Vite, then sign in at `/login` with:

- Email: `demo.admin@ritualos.test`
- Password: `RitualOS-local-2026!`

The local-only credentials are configured in the ignored `.env.local` file. Change them there if needed, then restart Vite. Demo sign-in is enabled only in Vite development mode and is not a real Base44 account. The demo admin dashboard includes the same tabs as the connected admin (Overview, Rituals, Categories, Users, Purchases, Completions, Reminders, and Database). Rituals and categories can be created, edited, published, and deleted; these changes persist in this browser's local storage and only affect this local demo catalog. Purchases, completions, and reminder delivery require a connected backend and are not simulated offline. The demo does not sync to Base44 or any shared production site. Do not deploy the demo credentials or use this mode for production.

### Test with a real Base44 app

There is no shared demo admin account or seeded ritual data in this repository. For a safe test setup:

1. Link the clone to your Base44 app and publish it once, as described above.
2. Start `base44 dev`, register your own test account at `/register`, and complete email verification.
3. Promote that account to the `admin` role in the Base44 dashboard. Admin permissions are managed by Base44; do not grant admin access from frontend code or use a hard-coded shared password.
4. Open `/admin` to create a category and ritual, add its steps, and publish it. Public pages show published rituals only.

The local database is temporary. Recreate demo categories and rituals after restarting the local backend, or add content in the hosted app if you are testing with `base44 dev --remote` (which writes to production data).

## Frontend Only, Hosted Backend

To work on just the frontend against your app's live hosted backend:

```bash
base44 dev --remote
```

⚠️ In this mode writes go to your app's **production data** — plain `base44 dev` keeps everything local.

## Publish Your Changes

After pushing your changes to git, open the Base44 dashboard and publish the app:

```bash
base44 dashboard open
```

This repo syncs to Base44 through git, so publish from the dashboard rather than `base44 deploy` — a CLI deploy ships your local tree directly, bypassing the sync, and the deployed state silently diverges from the repo.

## Docs & Support

GitHub integration: [https://docs.base44.com/developers/app-code/local-development/github](https://docs.base44.com/developers/app-code/local-development/github)

Local development: [https://docs.base44.com/developers/backend/overview/local-dev/local-development-overview](https://docs.base44.com/developers/backend/overview/local-dev/local-development-overview)

Support: [https://app.base44.com/support](https://app.base44.com/support)
