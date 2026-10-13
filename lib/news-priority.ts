/** A headline-only attention cue, never a verified event or trading signal. */
export function headlinePriority(title: string): string | null {
  const headline = title.trim();
  const rules: Array<[RegExp, string]> = [
    [/\b(bankrupt(?:cy)?|chapter 11|defaults? on (?:its |the )?debt|credit rating downgrad(?:e|ed))\b/i, "Financial distress"],
    [/\b(merger agreement|merges? with|to merge|acquir(?:e|es|ed|ing)|acquisition of|takeover bid|buyout offer|deal to buy)\b/i, "Major transaction"],
    [/\b(cuts?|lowers?|withdraws?|raises?|boosts?)\s+(?:(?:full.year|annual|quarterly|revenue|profit|earnings)\s+)?guidance\b/i, "Guidance change"],
    [/\b(?:beats?|misses?)\s+(?:(?:analyst|wall street)\s+)?(?:delivery|sales|revenue|profit|earnings)\s+estimates\b/i, "Reported result"],
    [/\b(?:reports?|posts?)\s+(?:(?:q[1-4]|quarterly|annual|full.year)\s+)?(?:earnings|results)\b|\bearnings\s+(?:beat|miss|rise|fall|jump|drop|plunge|surge)\b/i, "Earnings result"],
    [/\b(?:sec|doj|ftc)\s+(?:probes?|investigat(?:es|ion)|charges?|sues?)\b|\b(?:probe|investigation|charges?|lawsuit)\s+(?:by|from)\s+(?:the\s+)?(?:sec|doj|ftc)\b/i, "Regulatory action"],
    [/\brecalls?\s+(?:products?|vehicles?|devices?|medicines?|drugs?)\b|\bhalts?\s+(?:sales|production)\b/i, "Product disruption"],
  ];
  return rules.find(([pattern]) => pattern.test(headline))?.[1] || null;
}
