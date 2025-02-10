import { users, transcriptionSettings, transcriptions, type User, type InsertUser, type Transcription, type InsertTranscription, type TranscriptionSettings, type InsertTranscriptionSettings } from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { pool } from "./db";
import { transcriptionSegments, type InsertTranscriptionSegment, type TranscriptionSegment } from "@shared/schema";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  createTranscription(transcription: InsertTranscription): Promise<Transcription>;
  getTranscriptionsByUserId(userId: number): Promise<Transcription[]>;
  updateTranscription(id: number, updates: Partial<InsertTranscription>): Promise<Transcription>;

  // New methods for transcription settings
  getTranscriptionSettings(userId: number): Promise<TranscriptionSettings | undefined>;
  updateTranscriptionSettings(userId: number, settings: Partial<InsertTranscriptionSettings>): Promise<TranscriptionSettings>;

  // Add to IStorage interface
  createTranscriptionSegment(segment: InsertTranscriptionSegment): Promise<TranscriptionSegment>;
  getTranscriptionSegments(transcriptionId: number): Promise<TranscriptionSegment[]>;

  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createTranscription(insertTranscription: InsertTranscription): Promise<Transcription> {
    const [transcription] = await db
      .insert(transcriptions)
      .values(insertTranscription)
      .returning();
    return transcription;
  }

  async getTranscriptionsByUserId(userId: number): Promise<Transcription[]> {
    return await db
      .select()
      .from(transcriptions)
      .where(eq(transcriptions.userId, userId))
      .orderBy(transcriptions.createdAt);
  }

  async updateTranscription(id: number, updates: Partial<InsertTranscription>): Promise<Transcription> {
    const [updated] = await db
      .update(transcriptions)
      .set(updates)
      .where(eq(transcriptions.id, id))
      .returning();

    if (!updated) {
      throw new Error('Transcription not found');
    }

    return updated;
  }

  async getTranscriptionSettings(userId: number): Promise<TranscriptionSettings | undefined> {
    const [settings] = await db
      .select()
      .from(transcriptionSettings)
      .where(eq(transcriptionSettings.userId, userId));
    return settings;
  }

  async updateTranscriptionSettings(userId: number, settings: Partial<InsertTranscriptionSettings>): Promise<TranscriptionSettings> {
    // Try to update existing settings first
    const [updated] = await db
      .update(transcriptionSettings)
      .set(settings)
      .where(eq(transcriptionSettings.userId, userId))
      .returning();

    if (updated) return updated;

    // If no settings exist, create new ones
    const [created] = await db
      .insert(transcriptionSettings)
      .values({ ...settings, userId })
      .returning();

    return created;
  }

  // Add to DatabaseStorage class
  async createTranscriptionSegment(insertSegment: InsertTranscriptionSegment): Promise<TranscriptionSegment> {
    const [segment] = await db
      .insert(transcriptionSegments)
      .values(insertSegment)
      .returning();
    return segment;
  }

  async getTranscriptionSegments(transcriptionId: number): Promise<TranscriptionSegment[]> {
    return await db
      .select()
      .from(transcriptionSegments)
      .where(eq(transcriptionSegments.transcriptionId, transcriptionId))
      .orderBy(transcriptionSegments.startTime);
  }
}

export const storage = new DatabaseStorage();