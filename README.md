# LeadRakshak

Hindi-friendly lead recovery and follow-up CRM for Indian small businesses.

## Included
- Animated responsive CRM dashboard, lead pipeline and analytics
- Lead capture, edit, search, status filters and follow-up queue
- User-confirmed WhatsApp follow-up links (no automated sending)
- Quotation builder with line items, discount, tax estimate and print-to-PDF
- CSV export and JSON backup/restore
- Supabase email/password authentication, password reset and per-workspace cloud data (when configured)
- PostgreSQL schema, indexes and Row Level Security policies
- Local-only mode when Supabase environment variables are absent

## Local setup
1. Install Node.js 22 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Create a Supabase project and copy its Project URL and publishable/anon key into `.env.local`.
5. In Supabase SQL Editor, run `supabase/migrations/001_initial_schema.sql`.
6. In Supabase Authentication > URL Configuration, add `https://madhavchaudhary770-creator.github.io/Leadrakshak/` to Site URL and Redirect URLs.
7. In GitHub repository Settings > Secrets and variables > Actions, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` using the Supabase Project URL and publishable/anon key. Never add a service_role key.
8. In GitHub Actions, run **LeadRakshak Build and Deploy** manually to rebuild with the secrets.
9. Run `npm run dev`, `npm test` and `npm run build` for local development/verification.

## Environment
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (publishable/anon key only; never use service_role in browser)

## Security and limitations
- Database tables use Row Level Security and workspace membership checks.
- Each new authenticated user receives a personal workspace.
- Browser local mode stores data only on that browser/device; it is not cloud sync. Cloud accounts and sync require BOTH `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` GitHub Actions secrets. If either is missing, the site intentionally runs in local-demo mode.
- Voice input uses the browser Web Speech API where supported (typically Chrome/Chromium). Speech recognition may be processed by the browser provider; do not dictate highly sensitive information. Microphone permission is required and typing remains available.
- Voice capture fills a draft. The user must review and press Save; it does not silently create records.
- WhatsApp links open a prefilled message for the user to review/send; the app does not send messages automatically.
- Quotations are estimates, not GST-compliant tax invoices. No payment gateway or subscription billing is currently connected.
- Before commercial use, verify Supabase Auth email settings, run the SQL migration, configure both public secrets, test real sign-up/login/data isolation, enable backups, set billing limits and publish a reviewed privacy policy and terms.
