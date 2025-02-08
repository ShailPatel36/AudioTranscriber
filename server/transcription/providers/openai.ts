import OpenAI from "openai";
import { TranscriptionProvider, TranscriptionError } from "./base";
import { Readable } from "stream";

export class OpenAIProvider implements TranscriptionProvider {
  name = "openai";
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async transcribe(audio: Buffer, fileName: string): Promise<string> {
    try {
      const response = await this.client.audio.transcriptions.create({
        file: new Blob([audio], { type: 'audio/mpeg' }),
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