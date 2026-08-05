export type PolicyClass =
  | "allowed_editing"
  | "allowed_voice_adaptation"
  | "sensitive_professional"
  | "academic_integrity_risk"
  | "impersonation_risk"
  | "fraud_or_deception_risk"
  | "detector_evasion_request"
  | "unsupported";

export interface PolicyDecision {
  policyClass: PolicyClass;
  isAllowed: boolean;
  userNotice?: string;
  mitigationStrategy?: string;
}

export function classifyRequestIntent(text: string): PolicyDecision {
  if (/(?:bypass|beat|evade|fool).{0,25}(?:ai detector|detection|authorship check)/i.test(text)) {
    return {
      policyClass: "detector_evasion_request",
      isAllowed: true,
      userNotice: "I can help improve clarity, voice, and quality, but not optimize for evading authorship or AI-detection systems.",
      mitigationStrategy: "focus_on_quality_and_clarity",
    };
  }

  if (/(?:pretend to be|impersonate|write as if you are)\s+[A-Z][a-z]+/i.test(text)) {
    return {
      policyClass: "impersonation_risk",
      isAllowed: false,
      userNotice: "I can adapt general writing style traits, but I cannot deceptively impersonate a specific real individual.",
      mitigationStrategy: "reject_request",
    };
  }

  return {
    policyClass: "allowed_editing",
    isAllowed: true,
  };
}
