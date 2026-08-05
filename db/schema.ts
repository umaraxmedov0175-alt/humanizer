import { pgTable, uuid, text, integer, boolean, timestamp, jsonb, numeric } from "drizzle-orm/pg-core";

export const rewriteRequests = pgTable("rewrite_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id"),
  userId: text("user_id").notNull(),
  clientRequestId: text("client_request_id"),
  inputHash: text("input_hash").notNull(),
  inputFormat: text("input_format").default("plain_text").notNull(),
  channel: text("channel").notNull(),
  requestedLevel: text("requested_level"),
  requestedDialect: text("requested_dialect"),
  controls: jsonb("controls").notNull(),
  privacyMode: text("privacy_mode").default("ephemeral").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const rewriteOutputs = pgTable("rewrite_outputs", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id").notNull().references(() => rewriteRequests.id, { onDelete: "cascade" }),
  revisionNumber: integer("revision_number").default(1).notNull(),
  outputText: text("output_text").notNull(),
  outputHash: text("output_hash").notNull(),
  engineMode: text("engine_mode").notNull(),
  accepted: boolean("accepted").default(false).notNull(),
  warnings: jsonb("warnings").default([]).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const modelRuns = pgTable("model_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id").notNull().references(() => rewriteRequests.id, { onDelete: "cascade" }),
  stage: text("stage").notNull(),
  provider: text("provider"),
  modelId: text("model_id"),
  promptVersion: text("prompt_version"),
  attemptNumber: integer("attempt_number").notNull().default(1),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  latencyMs: integer("latency_ms"),
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  estimatedCost: numeric("estimated_cost", { precision: 12, scale: 6 }),
  resultStatus: text("result_status").notNull(),
  degraded: boolean("degraded").default(false).notNull(),
});

export const qualityReports = pgTable("quality_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  outputId: uuid("output_id").notNull().references(() => rewriteOutputs.id, { onDelete: "cascade" }),
  evaluatorVersion: text("evaluator_version").notNull(),
  scores: jsonb("scores").notNull(),
  failures: jsonb("failures").default([]).notNull(),
  confidence: numeric("confidence", { precision: 5, scale: 2 }),
  passed: boolean("passed").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const rewrites = pgTable("rewrites", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id"),
  sourceText: text("source_text").notNull(),
  outputText: text("output_text").notNull(),
  channel: text("channel").notNull().default("Business email"),
  level: text("level").notNull().default("B2"),
  naturalScore: integer("natural_score"),
  meaningScore: integer("meaning_score"),
  rhythmScore: integer("rhythm_score"),
  engine: text("engine").notNull().default("ai"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const voiceProfiles = pgTable("voice_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  sample: text("sample").notNull(),
  contractions: boolean("contractions").default(true).notNull(),
  shortParagraphs: boolean("short_paragraphs").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
