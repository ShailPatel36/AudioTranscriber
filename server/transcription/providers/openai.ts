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
    let tempPath: string | null = null;

    try {
      // Create a temporary file with a proper extension
      const tempDir = os.tmpdir();
      tempPath = path.join(tempDir, `temp-${Date.now()}-${fileName}`);

      console.log("OpenAI: Writing audio to temporary file:", tempPath);
      await fs.promises.writeFile(tempPath, audio);

      // Create a ReadStream from the temporary file
      const fileStream = fs.createReadStream(tempPath);

      console.log("OpenAI: Calling Whisper API...");
      const response = await this.client.audio.transcriptions.create({
        file: fileStream,
        model: "whisper-1",
      });

      console.log("OpenAI: Transcription successful");
      return response.text;
    } catch (error: any) {
      console.error("OpenAI transcription error:", error);
      throw new TranscriptionError(
        error.message || "Failed to transcribe with OpenAI",
        this.name
      );
    } finally {
      // Clean up temp file
      if (tempPath) {
        await fs.promises.unlink(tempPath).catch(console.error);
      }
    }
  }
}