import { users, transcriptions, type User, type InsertUser, type Transcription, type InsertTranscription } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createTranscription(transcription: InsertTranscription): Promise<Transcription>;
  getTranscriptionsByUserId(userId: number): Promise<Transcription[]>;
  updateTranscription(id: number, updates: Partial<InsertTranscription>): Promise<Transcription>;
  
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private transcriptions: Map<number, Transcription>;
  private currentUserId: number;
  private currentTranscriptionId: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.transcriptions = new Map();
    this.currentUserId = 1;
    this.currentTranscriptionId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createTranscription(insertTranscription: InsertTranscription): Promise<Transcription> {
    const id = this.currentTranscriptionId++;
    const transcription: Transcription = {
      ...insertTranscription,
      id,
      createdAt: new Date(),
    };
    this.transcriptions.set(id, transcription);
    return transcription;
  }

  async getTranscriptionsByUserId(userId: number): Promise<Transcription[]> {
    return Array.from(this.transcriptions.values())
      .filter(t => t.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateTranscription(id: number, updates: Partial<InsertTranscription>): Promise<Transcription> {
    const existing = this.transcriptions.get(id);
    if (!existing) {
      throw new Error('Transcription not found');
    }
    const updated = { ...existing, ...updates };
    this.transcriptions.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
