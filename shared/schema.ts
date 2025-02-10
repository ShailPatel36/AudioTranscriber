import { pgTable, text, serial, integer, boolean, timestamp, primaryKey, numeric } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  transcriptions: many(transcriptions),
  settings: many(transcriptionSettings),
}));

export const transcriptionSettings = pgTable("transcription_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: text("provider").notNull().default("openai"),
  openaiKey: text("openai_key"),
  assemblyaiKey: text("assemblyai_key"),
  defaultLanguage: text("default_language").default("auto"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const transcriptionSettingsRelations = relations(transcriptionSettings, ({ one }) => ({
  user: one(users, {
    fields: [transcriptionSettings.userId],
    references: [users.id],
  }),
}));

export const transcriptions = pgTable("transcriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  sourceType: text("source_type").notNull(), // 'file' or 'youtube'
  sourceUrl: text("source_url"), // For YouTube videos
  fileName: text("file_name"), // For uploaded files
  status: text("status").notNull(), // 'processing', 'completed', 'failed'
  text: text("text"), // The transcribed text
  provider: text("provider").notNull(), // Which provider was used
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const transcriptionSegments = pgTable("transcription_segments", {
  id: serial("id").primaryKey(),
  transcriptionId: integer("transcription_id").notNull().references(() => transcriptions.id, { onDelete: 'cascade' }),
  text: text("text").notNull(),
  startTime: integer("start_time").notNull(), // Time in milliseconds
  endTime: integer("end_time").notNull(), // Time in milliseconds
  confidence: numeric("confidence"), // Optional confidence score
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const transcriptionsRelations = relations(transcriptions, ({ one, many }) => ({
  user: one(users, {
    fields: [transcriptions.userId],
    references: [users.id],
  }),
  segments: many(transcriptionSegments),
}));

export const transcriptionSegmentsRelations = relations(transcriptionSegments, ({ one }) => ({
  transcription: one(transcriptions, {
    fields: [transcriptionSegments.transcriptionId],
    references: [transcriptions.id],
  }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertTranscriptionSettingsSchema = createInsertSchema(transcriptionSettings)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    provider: z.enum(["openai", "assemblyai", "commonvoice"]),
    openaiKey: z.string().optional(),
    assemblyaiKey: z.string().optional(),
    defaultLanguage: z.string().optional(),
  });

export const insertTranscriptionSchema = createInsertSchema(transcriptions)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    sourceType: z.enum(["file", "youtube"]),
    status: z.enum(["processing", "completed", "failed"]),
  });

export const insertTranscriptionSegmentSchema = createInsertSchema(transcriptionSegments)
  .omit({ id: true, createdAt: true });

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type TranscriptionSettings = typeof transcriptionSettings.$inferSelect;
export type InsertTranscriptionSettings = z.infer<typeof insertTranscriptionSettingsSchema>;

export type Transcription = typeof transcriptions.$inferSelect;
export type InsertTranscription = z.infer<typeof insertTranscriptionSchema>;

export type TranscriptionSegment = typeof transcriptionSegments.$inferSelect;
export type InsertTranscriptionSegment = z.infer<typeof insertTranscriptionSegmentSchema>;