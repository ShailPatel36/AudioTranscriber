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
      console.log(`MediaConverter: Starting conversion for file: ${originalFilename}`);
      console.log(`MediaConverter: Writing input file to: ${inputPath}`);

      // Write input buffer to temporary file
      await fs.promises.writeFile(inputPath, inputBuffer);
      console.log("MediaConverter: Input file written successfully");

      // Convert to MP3
      await new Promise<void>((resolve, reject) => {
        console.log("MediaConverter: Starting FFmpeg conversion");
        ffmpeg(inputPath)
          .toFormat("mp3")
          .on("start", (commandLine) => {
            console.log("MediaConverter: FFmpeg command:", commandLine);
          })
          .on("progress", (progress) => {
            console.log(`MediaConverter: Processing: ${progress.percent}% done`);
          })
          .on("error", (err) => {
            console.error("MediaConverter: FFmpeg conversion error:", err);
            reject(new Error(`Failed to convert media file: ${err.message}`));
          })
          .on("end", () => {
            console.log("MediaConverter: FFmpeg conversion completed successfully");
            resolve();
          })
          .save(outputPath);
      });

      // Read the converted file
      console.log("MediaConverter: Reading converted file");
      const convertedBuffer = await fs.promises.readFile(outputPath);
      console.log("MediaConverter: Successfully read converted file");
      return convertedBuffer;
    } catch (error: any) {
      console.error("MediaConverter: Error during conversion:", error);
      throw new Error(`Media conversion failed: ${error.message}`);
    } finally {
      // Clean up temporary files
      console.log("MediaConverter: Cleaning up temporary files");
      try {
        if (fs.existsSync(inputPath)) {
          await fs.promises.unlink(inputPath);
          console.log("MediaConverter: Cleaned up input file");
        }
        if (fs.existsSync(outputPath)) {
          await fs.promises.unlink(outputPath);
          console.log("MediaConverter: Cleaned up output file");
        }
      } catch (cleanupError) {
        console.error("MediaConverter: Error during cleanup:", cleanupError);
      }
    }
  }

  static async extractAudio(inputBuffer: Buffer, originalFilename: string): Promise<Buffer> {
    console.log(`MediaConverter: Starting audio extraction for: ${originalFilename}`);
    const isVideo = originalFilename.match(/\.(mp4|mov|avi|mkv|webm)$/i);

    try {
      // For both video and audio files, convert to MP3 format
      const result = await this.convertToMp3(inputBuffer, originalFilename);
      console.log("MediaConverter: Audio extraction completed successfully");
      return result;
    } catch (error: any) {
      console.error("MediaConverter: Error during audio extraction:", error);
      throw new Error(`Failed to extract audio: ${error.message}`);
    }
  }
}