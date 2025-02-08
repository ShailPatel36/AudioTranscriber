import OpenAI from "openai";
import { TranscriptionProvider, TranscriptionError } from "./base";
import { Readable } from "stream";
import path from "path";

export class OpenAIProvider implements TranscriptionProvider {
  name = "openai";
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async transcribe(audio: Buffer, fileName: string): Promise<string> {
    try {
      // Create a file object that OpenAI's API can handle
      const file = {
        buffer: audio,
        name: fileName,
      } as File;

      const response = await this.client.audio.transcriptions.create({
        file,
        model: "whisper-1",
      });

      return response.text;
    } catch (error: any) {
      throw new TranscriptionError(
        error.message || "Failed to transcribe with OpenAI",
        this.name
      );
    }
  }
}