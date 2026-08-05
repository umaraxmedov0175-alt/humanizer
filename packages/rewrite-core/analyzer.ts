import { parseMarkdownToAST } from "../document-compiler/markdown-parser";
import { extractExactInvariants, ExactInvariant } from "../constraint-ledger/invariants";
import { extractClaimsFromText, Claim } from "../constraint-ledger/claims";

export interface DocumentAnalysisReport {
  ast: ReturnType<typeof parseMarkdownToAST>;
  invariants: ExactInvariant[];
  claims: Claim[];
  detectedLanguage: string;
  wordCount: number;
  hasSensitiveData: boolean;
}

export function analyzeDocument(text: string): DocumentAnalysisReport {
  const ast = parseMarkdownToAST(text);
  const invariants = extractExactInvariants(text);
  const claims = extractClaimsFromText(text);

  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const hasSensitiveData = /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|\b(?:\+?\d[\d ()-]{8,}\d)\b/.test(text);

  return {
    ast,
    invariants,
    claims,
    detectedLanguage: "en",
    wordCount,
    hasSensitiveData,
  };
}
