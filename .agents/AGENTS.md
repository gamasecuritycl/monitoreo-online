# GAMA SEGURIDAD - AGENT RULES

## Git Push Protocol
Whenever executing `git push` on Windows, ALWAYS clear the `GITHUB_TOKEN` environment variable first in PowerShell:
`$env:GITHUB_TOKEN=$null; git push origin main`
This ensures Git uses the persistent authenticated keyring credentials (`gamasecuritycl`) rather than stale process tokens.
