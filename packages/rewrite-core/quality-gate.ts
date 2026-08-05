export type QualityGateStatus =
  | "accepted"
  | "accepted_with_warnings"
  | "degraded_fallback"
  | "needs_user_review"
  | "rejected_quality_failure"
  | "provider_failure";

export interface QualityGateResult {
  status: QualityGateStatus;
  passed: boolean;
  confidence: number; // 0 to 100
  warnings: string[];
  failures: string[];
}

export function evaluateQualityGate(
  fidelityScore: number,
  missingSentinelsCount: number,
  unsupportedClaimsCount: number,
  isFallback: boolean
): QualityGateResult {
  const warnings: string[] = [];
  const failures: string[] = [];

  if (missingSentinelsCount > 0) {
    failures.push(`Failed to restore ${missingSentinelsCount} protected sentinel span(s).`);
  }

  if (unsupportedClaimsCount > 0) {
    warnings.push(`Detected ${unsupportedClaimsCount} potential unsupported claim(s).`);
  }

  if (fidelityScore < 80) {
    failures.push(`Claim fidelity score (${fidelityScore}/100) below minimum threshold of 80.`);
  }

  if (isFallback) {
    warnings.push("Executed Deterministic Safe Copyedit Fallback engine.");
    return {
      status: "degraded_fallback",
      passed: true,
      confidence: 88,
      warnings,
      failures,
    };
  }

  if (failures.length > 0) {
    return {
      status: "rejected_quality_failure",
      passed: false,
      confidence: Math.round(fidelityScore * 0.7),
      warnings,
      failures,
    };
  }

  if (warnings.length > 0) {
    return {
      status: "accepted_with_warnings",
      passed: true,
      confidence: Math.round(fidelityScore * 0.95),
      warnings,
      failures,
    };
  }

  return {
    status: "accepted",
    passed: true,
    confidence: Math.round(fidelityScore),
    warnings,
    failures,
  };
}
