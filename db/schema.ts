import { pgTable, uuid, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

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
