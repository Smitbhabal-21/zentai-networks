import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);
const badNames = files.filter(path => /(^|\/)(\.env(\.|$)|secrets?\.(json|ya?ml|toml)$|[^/]+\.(pem|p12|pfx|key)$)/i.test(path) && path !== ".env.example");
const source = files.filter(path => /\.(tsx?|mjs|cjs|jsx?)$/.test(path) && !path.startsWith("scripts/security-check"));
const publicSecrets = source.flatMap(path => {
  const content = readFileSync(path, "utf8");
  return [...content.matchAll(/NEXT_PUBLIC_[A-Z0-9_]*(?:SECRET|PRIVATE|SERVICE_ROLE|API_KEY|PASSWORD|TOKEN)[A-Z0-9_]*/g)].map(match => `${path}: ${match[0]}`);
});
const migration = readFileSync("supabase/migrations/20261020000000_fpa_snapshots.sql", "utf8");
const proxy = readFileSync("proxy.ts", "utf8");
const failures = [
  ...badNames.map(path => `Tracked private file: ${path}`),
  ...publicSecrets.map(value => `Potential browser-exposed secret: ${value}`),
  ...(!/enable row level security/i.test(migration) ? ["FP&A RLS is missing"] : []),
  ...(!/Content-Security-Policy/.test(proxy) ? ["CSP is missing"] : []),
];
if (failures.length) {
  for (const failure of failures) console.error(failure);
  process.exitCode = 1;
} else console.log("Security gate passed: no tracked secret files or public secret names; FP&A RLS and CSP present.");
