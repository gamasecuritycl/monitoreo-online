# GAMA SEGURIDAD - AGENT RULES

## Git Push Protocol
Whenever executing `git push` on Windows, ALWAYS clear the `GITHUB_TOKEN` environment variable first in PowerShell:
`$env:GITHUB_TOKEN=$null; git push origin main`
This ensures Git uses the persistent authenticated keyring credentials (`gamasecuritycl`) rather than stale process tokens.

## Mandatory Build & Deployment Protocol
BEFORE performing any `git push` or Vercel deployment:
1. ALWAYS execute local compilation first in `dashboard/`: `npm run build`. Verify 100% clean compilation with 0 TypeScript or Next.js build errors.
2. If and only if local compilation succeeds, execute `$env:GITHUB_TOKEN=$null; git add .; git commit -m "..."; git push origin main`.
3. Then execute Vercel production deployment in `dashboard/`: `npm run deploy` (`npx vercel --prod --yes`).
4. Alternatively, execute the automated fail-safe script `dashboard/deploy.ps1`.

