import { AssemblyAI } from "assemblyai";
import { TranscriptionProvider, TranscriptionError } from "./base";

export class AssemblyAIProvider implements TranscriptionProvider {
  name = "assemblyai";
  private client: AssemblyAI;

  constructor(apiKey: string) {
    this.client = new AssemblyAI({
      apiKey: apiKey
    });
  }

  async transcribe(audio: Buffer, fileName: string): Promise<string> {
    try {
      // Upload the audio file
      const uploadUrl = await this.client.upload(audio);

      // Create a transcription
      const transcript = await this.client.transcripts.create({
        audio_url: uploadUrl,
      });

      // Wait for completion
      const result = await this.client.transcripts.waitUntilComplete(transcript.id);

      if (result.status === 'error') {
        throw new Error(result.error);
      }

      return result.text || '';
    } catch (error: any) {
      throw new TranscriptionError(
        error.message || "Failed to transcribe with AssemblyAI",
        this.name
      );
    }
  }
}