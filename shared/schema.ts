import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const transcriptionSettings = pgTable("transcription_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  provider: text("provider").notNull().default("openai"),
  openaiKey: text("openai_key"),
  assemblyaiKey: text("assemblyai_key"),
});

export const transcriptions = pgTable("transcriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  sourceType: text("source_type").notNull(), // 'file' or 'youtube'
  sourceUrl: text("source_url"), // For YouTube videos
  fileName: text("file_name"), // For uploaded files
  status: text("status").notNull(), // 'processing', 'completed', 'failed'
  text: text("text"), // The transcribed text
  provider: text("provider").notNull(), // Which provider was used
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertTranscriptionSettingsSchema = createInsertSchema(transcriptionSettings).omit({
  id: true,
});

export const insertTranscriptionSchema = createInsertSchema(transcriptions).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type TranscriptionSettings = typeof transcriptionSettings.$inferSelect;
export type Transcription = typeof transcriptions.$inferSelect;
export type InsertTranscription = z.infer<typeof insertTranscriptionSchema>;
export type InsertTranscriptionSettings = z.infer<typeof insertTranscriptionSettingsSchema>;