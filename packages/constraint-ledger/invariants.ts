export type InvariantType =
  | "number"
  | "date"
  | "currency"
  | "percentage"
  | "url"
  | "citation"
  | "identifier";

export interface ExactInvariant {
  id: string;
  type: InvariantType;
  value: string;
  originalText: string;
  isMandatory: boolean;
}

export function extractExactInvariants(text: string): ExactInvariant[] {
  const invariants: ExactInvariant[] = [];
  let count = 0;

  // 1. Currency
  const currencyMatches = text.match(/(?:\$|€|£|¥)\s*\d+(?:[.,]\d+)?(?:\s*(?:million|billion|trillion|k|m|b))?/gi) || [];
  currencyMatches.forEach((val) => {
    count++;
    invariants.push({
      id: `inv_curr_${count}`,
      type: "currency",
      value: val.trim(),
      originalText: val.trim(),
      isMandatory: true,
    });
  });

  // 2. Dates
  const dateMatches = text.match(/\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|June?|July?|Aug(?:ust)?|Sept(?:ember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:,\s*\d{4})?\b|\b\d{4}-\d{2}-\d{2}\b/gi) || [];
  dateMatches.forEach((val) => {
    count++;
    invariants.push({
      id: `inv_date_${count}`,
      type: "date",
      value: val.trim(),
      originalText: val.trim(),
      isMandatory: true,
    });
  });

  // 3. Percentages
  const percentMatches = text.match(/\b\d+(?:[.,]\d+)?\s*%/g) || [];
  percentMatches.forEach((val) => {
    count++;
    invariants.push({
      id: `inv_pct_${count}`,
      type: "percentage",
      value: val.trim(),
      originalText: val.trim(),
      isMandatory: true,
    });
  });

  // 4. URLs
  const urlMatches = text.match(/https?:\/\/[^\s<>"]+/gi) || [];
  urlMatches.forEach((val) => {
    count++;
    invariants.push({
      id: `inv_url_${count}`,
      type: "url",
      value: val.trim(),
      originalText: val.trim(),
      isMandatory: true,
    });
  });

  return invariants;
}

export function verifyInvariantFidelity(invariants: ExactInvariant[], outputText: string): { invariantScore: number; missingInvariants: ExactInvariant[] } {
  if (!invariants.length) return { invariantScore: 100, missingInvariants: [] };

  const outputLower = outputText.toLowerCase();
  const missingInvariants: ExactInvariant[] = [];

  invariants.forEach((inv) => {
    if (!outputLower.includes(inv.value.toLowerCase())) {
      missingInvariants.push(inv);
    }
  });

  const preserved = invariants.length - missingInvariants.length;
  const invariantScore = Math.round((100 * preserved) / invariants.length);

  return { invariantScore, missingInvariants };
}
