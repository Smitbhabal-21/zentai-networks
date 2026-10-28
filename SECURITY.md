# Zentai security controls

Run `npm run security-check`, `npm run typecheck`, `npm test`, and `npm run build` before release. The build runs the tracked-file and configuration gate automatically. Re-run `npm audit --omit=dev` when npm registry access is available; review findings before release.

| Area | Current control | Further operational check |
| --- | --- | --- |
| Provider keys and environment | Provider keys stay server-side; `.env*` files are ignored except the example. The build gate rejects tracked private-key files and suspicious `NEXT_PUBLIC_` names. | Scan Git history and rotate any exposed credential. Verify production variables in Vercel. |
| Authentication and private data | Supabase handles email sign-in; `fpa_snapshots` uses row-level security keyed to `auth.uid()`. No service-role key is used in the browser. | Keep RLS enabled and test two different accounts before accepting confidential finance data. |
| Browser-local finance data | CSVs are parsed in the browser; FP&A and procurement models persist in browser storage. Cloud saving is manual. | Use a trusted device; browser storage is not encrypted at rest and may be accessible to another user of the same browser profile. |
| Forms and exports | CSV and JSON imports enforce format and size limits. React escapes displayed text. Downloaded procurement CSV cells beginning like formulas are neutralized. | Do not add raw HTML rendering of imported fields. Recheck new input and export paths. |
| API surface | Public endpoints are read-only and validate symbol/range/count. No admin route exists. Responses do not grant wildcard CORS. | Add distributed rate limiting or Vercel WAF rules before heavy public traffic; in-memory counters cannot reliably limit serverless instances. |
| Browser protections | CSP uses a per-request script nonce; frame, MIME, referrer, HSTS, permissions, and opener headers are set. | Check browser console and deployed headers after each framework upgrade. |
| Dependencies | Versions are locked in `package-lock.json`. | Run registry-backed `npm audit`; apply security updates after testing. |

These are layered controls, not a promise that the product cannot be compromised. A full security audit also needs deployment configuration, Supabase settings, access logs, history scanning, and an independent penetration test.
