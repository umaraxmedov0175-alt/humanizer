import { DocumentNode } from "../document-compiler/nodes";
import { Claim } from "../constraint-ledger/claims";

export interface BlockRewritePlan {
  nodeId: string;
  intent: "preserve" | "clarify" | "compress" | "expand" | "restructure";
  transformationStrength: number; // 0 to 100
  protectedClaimIds: string[];
  targetRegister: string;
  targetLengthRange: [number, number];
}

export interface RewritePlan {
  documentGoal: string;
  blockPlans: BlockRewritePlan[];
  globalWarnings: string[];
}

export function buildTransformationPlan(nodes: DocumentNode[], claims: Claim[], targetLevel: string, channel: string): RewritePlan {
  const globalWarnings: string[] = [];

  const blockPlans: BlockRewritePlan[] = nodes.map((node) => {
    const nodeClaims = claims.filter((c) => c.evidenceNodeIds.includes(node.id));
    const wordCount = node.type === "paragraph" ? node.text.split(/\s+/).length : 10;

    return {
      nodeId: node.id,
      intent: node.isLocked ? "preserve" : "clarify",
      transformationStrength: node.isLocked ? 0 : 65,
      protectedClaimIds: nodeClaims.map((c) => c.id),
      targetRegister: channel.toLowerCase().includes("academic") ? "formal" : "professional",
      targetLengthRange: [Math.max(5, Math.round(wordCount * 0.8)), Math.round(wordCount * 1.2)],
    };
  });

  return {
    documentGoal: `Transform text for ${channel} at CEFR ${targetLevel}`,
    blockPlans,
    globalWarnings,
  };
}
