import { users, transcriptions, type User, type InsertUser, type Transcription, type InsertTranscription } from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  createTranscription(transcription: InsertTranscription): Promise<Transcription>;
  getTranscriptionsByUserId(userId: number): Promise<Transcription[]>;
  updateTranscription(id: number, updates: Partial<InsertTranscription>): Promise<Transcription>;

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
}

export const storage = new DatabaseStorage();