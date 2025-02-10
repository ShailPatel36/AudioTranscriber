import ytdl from "ytdl-core";
import ffmpeg from "fluent-ffmpeg";
import { Readable } from "stream";
import { TranscriptionError } from "./providers/base";
import os from "os";
import path from "path";
import fs from "fs";

export class YouTubeService {
  async downloadAndExtractAudio(url: string): Promise<{ buffer: Buffer; videoTitle: string }> {
    try {
      // Verify URL and get video info
      if (!ytdl.validateURL(url)) {
        throw new Error("Invalid YouTube URL");
      }

      const info = await ytdl.getInfo(url);
      const videoTitle = info.videoDetails.title;

      // Create temporary file paths
      const tempDir = os.tmpdir();
      const tempVideoPath = path.join(tempDir, `yt-${Date.now()}.mp4`);
      const tempAudioPath = path.join(tempDir, `yt-${Date.now()}.mp3`);

      // Download video
      console.log(`Downloading YouTube video: ${videoTitle}`);
      const videoStream = ytdl(url, { quality: "highestaudio" });

      // Convert to audio using ffmpeg
      await new Promise<void>((resolve, reject) => {
        ffmpeg(videoStream)
          .toFormat("mp3")
          .on("error", (err) => {
            console.error("FFmpeg error:", err);
            reject(new Error("Failed to process video audio"));
          })
          .on("end", () => {
            console.log("Audio extraction completed");
            resolve();
          })
          .save(tempAudioPath);
      });

      // Read the audio file into a buffer
      const audioBuffer = await fs.promises.readFile(tempAudioPath);

      // Clean up temporary files
      await Promise.all([
        fs.promises.unlink(tempAudioPath).catch(console.error),
        fs.promises.unlink(tempVideoPath).catch(console.error),
      ]);

      return {
        buffer: audioBuffer,
        videoTitle,
      };
    } catch (error: any) {
      console.error("YouTube processing error:", error);
      throw new TranscriptionError(
        error.message || "Failed to process YouTube video",
        "youtube"
      );
    }
  }

  // Helper to extract video ID from URL
  static getVideoId(url: string): string {
    try {
      return ytdl.getVideoID(url);
    } catch (error) {
      throw new Error("Invalid YouTube URL");
    }
  }

  // Validate YouTube URL
  static isValidUrl(url: string): boolean {
    return ytdl.validateURL(url);
  }
}
