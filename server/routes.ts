import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import multer from "multer";
import { insertTranscriptionSchema } from "@shared/schema";
import { TranscriptionProviderFactory } from "./transcription/provider-factory";
import { YouTubeService } from "./transcription/youtube-service";

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Accept audio files and videos
    if (file.mimetype.startsWith('audio/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio and video files are allowed.'));
    }
  }
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

  // Update the file upload endpoint
  app.post("/api/transcribe/file", upload.single("file"), async (req: Request, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });

      console.log(`Processing file upload: ${req.file.originalname}`);

      const settings = await storage.getTranscriptionSettings(req.user!.id);
      const provider = settings?.provider || "openai";

      // Verify API key is set
      const apiKey = provider === "openai" ? settings?.openaiKey : settings?.assemblyaiKey;
      if (!apiKey && provider !== "commonvoice") {
        return res.status(400).json({ 
          message: `API key for ${provider} is not set. Please configure it in settings.` 
        });
      }

      console.log(`Using transcription provider: ${provider}`);

      const transcription = await storage.createTranscription({
        userId: req.user!.id,
        sourceType: "file",
        fileName: req.file.originalname,
        status: "processing",
        text: "Starting transcription process...",
        sourceUrl: null,
        provider,
      });

      // Process transcription in the background
      (async () => {
        try {
          console.log(`Starting transcription for file: ${req.file!.originalname}`);

          const transcriptionProvider = TranscriptionProviderFactory.getProvider({
            provider,
            apiKey,
          });

          // Update status before starting transcription
          await storage.updateTranscription(transcription.id, {
            text: "Transcribing audio...",
          });

          const text = await transcriptionProvider.transcribe(
            req.file!.buffer,
            req.file!.originalname
          );

          // Split text into segments for progress updates
          const segments = text.split(/[.!?]+\s+/)
            .filter(segment => segment.trim().length > 0);

          // Process segments in batches and show progress
          const batchSize = 5;
          let processedText = "";

          for (let i = 0; i < segments.length; i += batchSize) {
            const batch = segments.slice(i, i + batchSize);
            processedText += batch.join(" ") + " ";
            const progress = Math.round(((i + batch.length) / segments.length) * 100);

            await storage.updateTranscription(transcription.id, {
              text: processedText,
              status: "processing",
            });

            // Small delay to prevent database overload
            await new Promise(resolve => setTimeout(resolve, 500));
          }

          // Final update
          await storage.updateTranscription(transcription.id, {
            status: "completed",
            text: processedText.trim(),
          });

          console.log(`Transcription ${transcription.id} completed and saved`);
        } catch (error: any) {
          console.error("Failed to process transcription:", error);
          await storage.updateTranscription(transcription.id, {
            status: "failed",
            text: `Error: ${error.message}`,
          });
        }
      })();

      res.json(transcription);
    } catch (error: any) {
      console.error("File transcription error:", error);
      res.status(500).json({ message: error.message || "Failed to process file" });
    }
  });

  app.post("/api/transcribe/youtube", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });
      const { url } = req.body;
      if (!url) return res.status(400).json({ message: "No URL provided" });

      // Validate YouTube URL
      if (!YouTubeService.isValidUrl(url)) {
        return res.status(400).json({ message: "Invalid YouTube URL" });
      }

      const settings = await storage.getTranscriptionSettings(req.user!.id);
      const provider = settings?.provider || "openai";

      // Verify API key is set
      const apiKey = provider === "openai" ? settings?.openaiKey : settings?.assemblyaiKey;
      if (!apiKey && provider !== "commonvoice") {
        return res.status(400).json({ 
          message: `API key for ${provider} is not set. Please configure it in settings.` 
        });
      }

      // Create initial transcription record
      const transcription = await storage.createTranscription({
        userId: req.user!.id,
        sourceType: "youtube",
        sourceUrl: url,
        status: "processing",
        text: "Downloading YouTube video...",
        fileName: null,
        provider,
      });

      // Process transcription in the background
      (async () => {
        try {
          console.log(`Starting YouTube transcription: ${url}`);

          // Update status for download
          await storage.updateTranscription(transcription.id, {
            text: "Downloading and extracting audio...",
          });

          const youtubeService = new YouTubeService();
          const { buffer, videoTitle } = await youtubeService.downloadAndExtractAudio(url);

          // Update status for transcription start
          await storage.updateTranscription(transcription.id, {
            text: "Audio extracted. Starting transcription...",
          });

          const transcriptionProvider = TranscriptionProviderFactory.getProvider({
            provider,
            apiKey,
          });

          // Get the full transcription
          const text = await transcriptionProvider.transcribe(buffer, videoTitle);

          // Split text into segments and process in batches
          const segments = text.split(/[.!?]+\s+/)
            .filter(segment => segment.trim().length > 0)
            .map((segment, index) => ({
              transcriptionId: transcription.id,
              text: segment.trim(),
              startTime: index * 4000,
              endTime: (index + 1) * 4000,
              confidence: 1.0,
            }));

          // Process segments in batches of 5 and update progress
          const batchSize = 5;
          let processedText = "";

          for (let i = 0; i < segments.length; i += batchSize) {
            const batch = segments.slice(i, i + batchSize);

            // Store batch segments
            await Promise.all(
              batch.map(segment => storage.createTranscriptionSegment(segment))
            );

            // Update transcription text with progress
            processedText += batch.map(s => s.text).join(" ") + " ";
            const progress = Math.round(((i + batch.length) / segments.length) * 100);

            await storage.updateTranscription(transcription.id, {
              text: processedText,
              status: "processing",
            });

            // Small delay to prevent database overload
            await new Promise(resolve => setTimeout(resolve, 500));
          }

          // Final update with completed status
          await storage.updateTranscription(transcription.id, {
            status: "completed",
            text: processedText.trim(),
          });

          console.log(`YouTube transcription ${transcription.id} completed and saved`);
        } catch (error: any) {
          console.error("Failed to process YouTube transcription:", error);
          await storage.updateTranscription(transcription.id, {
            status: "failed",
            text: `Error: ${error.message}`,
          });
        }
      })();

      res.json(transcription);
    } catch (error: any) {
      console.error("YouTube transcription error:", error);
      res.status(500).json({ message: error.message || "Failed to process YouTube URL" });
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

  // Add new endpoint for fetching segments
  app.get("/api/transcriptions/:id/segments", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Not authenticated" });

      const transcriptionId = parseInt(req.params.id);
      if (isNaN(transcriptionId)) {
        return res.status(400).json({ message: "Invalid transcription ID" });
      }

      const segments = await storage.getTranscriptionSegments(transcriptionId);
      res.json(segments);
    } catch (error) {
      console.error("Failed to fetch transcription segments:", error);
      res.status(500).json({ message: "Failed to fetch segments" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}