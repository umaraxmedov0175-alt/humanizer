export type SentinelType =
  | "code"
  | "url"
  | "email"
  | "citation"
  | "formula"
  | "quote"
  | "placeholder"
  | "legal_clause"
  | "user_locked";

export interface ProtectedSpan {
  id: string;
  type: SentinelType;
  original: string;
  checksum: string;
  restorationMode: "exact" | "normalized";
}

export function computeChecksum(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(4, "0").toUpperCase().substring(0, 4);
}

export function generateSentinelToken(type: SentinelType, id: string, checksum: string): string {
  return `⟦HX:${type.toUpperCase()}:${id.substring(0, 8)}:${checksum}⟧`;
}

export class SentinelRegistry {
  private spans = new Map<string, ProtectedSpan>();
  private counter = 0;

  public registerSpan(original: string, type: SentinelType, mode: "exact" | "normalized" = "exact"): string {
    this.counter++;
    const id = `span_${this.counter}_${Date.now().toString(36)}`;
    const checksum = computeChecksum(original);
    const token = generateSentinelToken(type, id, checksum);

    const span: ProtectedSpan = {
      id,
      type,
      original,
      checksum,
      restorationMode: mode,
    };

    this.spans.set(token, span);
    return token;
  }

  public getSpan(token: string): ProtectedSpan | undefined {
    return this.spans.get(token);
  }

  public getRegisteredTokens(): string[] {
    return Array.from(this.spans.keys());
  }

  public restoreSentinels(text: string): { restoredText: string; missingTokens: string[] } {
    let restoredText = text;
    const missingTokens: string[] = [];

    for (const [token, span] of this.spans.entries()) {
      if (!restoredText.includes(token)) {
        missingTokens.push(token);
      } else {
        restoredText = restoredText.replaceAll(token, span.original);
      }
    }

    return { restoredText, missingTokens };
  }
}
