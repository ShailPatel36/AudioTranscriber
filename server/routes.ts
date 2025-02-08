import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import multer from "multer";
import { insertTranscriptionSchema } from "@shared/schema";
import { TranscriptionProviderFactory } from "./transcription/provider-factory";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  app.get("/api/transcription-settings", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
      const settings = await storage.getTranscriptionSettings(req.user!.id);
      res.json(settings || { provider: "openai" }); // Default to OpenAI if no settings
    } catch (error) {
      console.error("Failed to fetch transcription settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.post("/api/transcription-settings", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
      const settings = await storage.updateTranscriptionSettings(req.user!.id, req.body);
      res.json(settings);
    } catch (error) {
      console.error("Failed to update transcription settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  app.post("/api/transcribe/file", upload.single("file"), async (req: Request, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });

      const settings = await storage.getTranscriptionSettings(req.user!.id);
      const provider = settings?.provider || "openai";

      const transcription = await storage.createTranscription({
        userId: req.user!.id,
        sourceType: "file",
        fileName: req.file.originalname,
        status: "processing",
        text: null,
        sourceUrl: null,
        provider,
      });

      // Process transcription in the background
      (async () => {
        try {
          const apiKey = provider === "openai" ? settings?.openaiKey : settings?.assemblyaiKey;
          if (!apiKey) {
            throw new Error(`API key for ${provider} is not set`);
          }

          const transcriptionProvider = TranscriptionProviderFactory.getProvider({
            provider,
            apiKey,
          });

          const text = await transcriptionProvider.transcribe(req.file!.buffer, req.file!.originalname);

          await storage.updateTranscription(transcription.id, {
            status: "completed",
            text,
          });
        } catch (error) {
          console.error("Failed to process transcription:", error);
          await storage.updateTranscription(transcription.id, {
            status: "failed",
            text: null,
          });
        }
      })();

      res.json(transcription);
    } catch (error) {
      console.error("File transcription error:", error);
      res.status(500).json({ message: "Failed to process file" });
    }
  });

  app.post("/api/transcribe/youtube", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
      const { url } = req.body;
      if (!url) return res.status(400).json({ message: "No URL provided" });

      const settings = await storage.getTranscriptionSettings(req.user!.id);
      const provider = settings?.provider || "openai";

      const transcription = await storage.createTranscription({
        userId: req.user!.id,
        sourceType: "youtube",
        sourceUrl: url,
        status: "processing",
        text: null,
        fileName: null,
        provider,
      });

      // Simulate YouTube transcription (you would need to implement actual YouTube processing)
      setTimeout(async () => {
        try {
          await storage.updateTranscription(transcription.id, {
            status: "completed",
            text: `Transcription of YouTube video: ${url}\n\n` +
                 `This is a simulated transcription. In production, this would download ` +
                 `the audio from YouTube and process it with the ${provider} provider.`,
          });
        } catch (error) {
          console.error("Failed to update transcription:", error);
          await storage.updateTranscription(transcription.id, {
            status: "failed",
            text: null,
          });
        }
      }, 5000);

      res.json(transcription);
    } catch (error) {
      console.error("YouTube transcription error:", error);
      res.status(500).json({ message: "Failed to process YouTube URL" });
    }
  });

  app.get("/api/transcriptions", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
      const transcriptions = await storage.getTranscriptionsByUserId(req.user!.id);
      res.json(transcriptions);
    } catch (error) {
      console.error("Failed to fetch transcriptions:", error);
      res.status(500).json({ message: "Failed to fetch transcriptions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}