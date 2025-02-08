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
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.file) return res.status(400).send("No file uploaded");

    const transcription = await storage.createTranscription({
      userId: req.user!.id,
      sourceType: "file",
      fileName: req.file.originalname,
      status: "processing",
      text: null,
      sourceUrl: null,
    });

    // Simulate transcription processing
    setTimeout(async () => {
      await storage.updateTranscription(transcription.id, {
        status: "completed",
        text: "Sample transcription text for " + req.file?.originalname,
      });
    }, 3000);

    res.json(transcription);
  });

  app.post("/api/transcribe/youtube", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { url } = req.body;
    if (!url) return res.status(400).send("No URL provided");

    const transcription = await storage.createTranscription({
      userId: req.user!.id,
      sourceType: "youtube",
      sourceUrl: url,
      status: "processing",
      text: null,
      fileName: null,
    });

    // Simulate transcription processing
    setTimeout(async () => {
      await storage.updateTranscription(transcription.id, {
        status: "completed",
        text: "Sample transcription text for YouTube video: " + url,
      });
    }, 3000);

    res.json(transcription);
  });

  app.get("/api/transcriptions", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const transcriptions = await storage.getTranscriptionsByUserId(req.user!.id);
    res.json(transcriptions);
  });

  const httpServer = createServer(app);
  return httpServer;
}
