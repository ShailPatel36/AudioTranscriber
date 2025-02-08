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
      // Create a temporary file
      const tempPath = path.join(os.tmpdir(), fileName);
      await fs.promises.writeFile(tempPath, audio);

      // Create a File instance from the temporary file
      const file = await fs.promises.readFile(tempPath);

      const response = await this.client.audio.transcriptions.create({
        file: new File([file], fileName, { type: 'audio/mpeg' }),
        model: "whisper-1",
      });

      // Clean up
      await fs.promises.unlink(tempPath);

      return response.text;
    } catch (error: any) {
      throw new TranscriptionError(
        error.message || "Failed to transcribe with OpenAI",
        this.name
      );
    }
  }
}