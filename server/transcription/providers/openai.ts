import OpenAI from "openai";
import { TranscriptionProvider, TranscriptionError } from "./base";
import path from "path";
import fs from "fs";
import os from "os";

export class OpenAIProvider implements TranscriptionProvider {
  name = "openai";
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async transcribe(audio: Buffer, fileName: string): Promise<string> {
    try {
      // Create a temporary file with a proper extension
      const tempDir = os.tmpdir();
      const tempPath = path.join(tempDir, `temp-${Date.now()}-${fileName}`);

      // Write the buffer to a temporary file
      await fs.promises.writeFile(tempPath, audio);

      try {
        const response = await this.client.audio.transcriptions.create({
          file: await fs.promises.readFile(tempPath),
          model: "whisper-1",
        });

        return response.text;
      } finally {
        // Clean up temp file in a finally block to ensure it's always deleted
        await fs.promises.unlink(tempPath).catch(console.error);
      }
    } catch (error: any) {
      console.error("OpenAI transcription error:", error);
      throw new TranscriptionError(
        error.message || "Failed to transcribe with OpenAI",
        this.name
      );
    }
  }
}