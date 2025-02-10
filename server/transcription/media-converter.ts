import ffmpeg from "fluent-ffmpeg";
import { Readable } from "stream";
import { promisify } from "util";
import { pipeline } from "stream";
import os from "os";
import path from "path";
import fs from "fs";

const pipelineAsync = promisify(pipeline);

export class MediaConverter {
  static async convertToMp3(inputBuffer: Buffer, originalFilename: string): Promise<Buffer> {
    const tempDir = os.tmpdir();
    const inputPath = path.join(tempDir, `input-${Date.now()}-${originalFilename}`);
    const outputPath = path.join(tempDir, `output-${Date.now()}.mp3`);

    try {
      // Write input buffer to temporary file
      await fs.promises.writeFile(inputPath, inputBuffer);

      // Convert to MP3
      await new Promise<void>((resolve, reject) => {
        ffmpeg(inputPath)
          .toFormat("mp3")
          .on("error", (err) => {
            console.error("FFmpeg conversion error:", err);
            reject(new Error("Failed to convert media file"));
          })
          .on("end", () => {
            console.log("Media conversion completed");
            resolve();
          })
          .save(outputPath);
      });

      // Read the converted file
      const convertedBuffer = await fs.promises.readFile(outputPath);
      return convertedBuffer;
    } finally {
      // Clean up temporary files
      await Promise.all([
        fs.promises.unlink(inputPath).catch(console.error),
        fs.promises.unlink(outputPath).catch(console.error),
      ]);
    }
  }

  static async extractAudio(inputBuffer: Buffer, originalFilename: string): Promise<Buffer> {
    const isVideo = originalFilename.match(/\.(mp4|mov|avi|mkv|webm)$/i);
    
    if (!isVideo) {
      // If it's already an audio file, just convert it to MP3 format
      return this.convertToMp3(inputBuffer, originalFilename);
    }

    // For video files, extract audio and convert to MP3
    return this.convertToMp3(inputBuffer, originalFilename);
  }
}
