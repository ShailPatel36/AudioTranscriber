import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import multer from "multer";
import { insertTranscriptionSchema } from "@shared/schema";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

export function registerRoutes(app: Express): Server {
  setupAuth(app);

  app.post("/api/transcribe/file", upload.single("file"), async (req: Request, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });

      const transcription = await storage.createTranscription({
        userId: req.user!.id,
        sourceType: "file",
        fileName: req.file.originalname,
        status: "processing",
        text: null,
        sourceUrl: null,
      });

      // Simulate transcription processing with a shorter timeout
      setTimeout(async () => {
        try {
          const fileType = req.file!.originalname.toLowerCase().endsWith('.mp3') ? 'audio' : 'video';
          await storage.updateTranscription(transcription.id, {
            status: "completed",
            text: `Transcription of ${fileType} file: ${req.file!.originalname}\n\n` +
                 `This is a simulated transcription of your ${fileType} file. ` +
                 `In a real implementation, this would be the actual transcribed content from your media file.`,
          });
        } catch (error) {
          console.error("Failed to update transcription:", error);
          await storage.updateTranscription(transcription.id, {
            status: "failed",
            text: null,
          });
        }
      }, 5000); // Reduced to 5 seconds

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

      const transcription = await storage.createTranscription({
        userId: req.user!.id,
        sourceType: "youtube",
        sourceUrl: url,
        status: "processing",
        text: null,
        fileName: null,
      });

      // Simulate transcription processing with a shorter timeout
      setTimeout(async () => {
        try {
          await storage.updateTranscription(transcription.id, {
            status: "completed",
            text: `Transcription of YouTube video: ${url}\n\n` +
                 `This is a simulated transcription of your YouTube video. ` +
                 `In a real implementation, this would be the actual transcribed content from the video.`,
          });
        } catch (error) {
          console.error("Failed to update transcription:", error);
          await storage.updateTranscription(transcription.id, {
            status: "failed",
            text: null,
          });
        }
      }, 5000); // Reduced to 5 seconds

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