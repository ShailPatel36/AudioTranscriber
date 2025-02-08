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
      // Upload the audio file directly
      const uploadResponse = await this.client.upload(audio);

      if (!uploadResponse.upload_url) {
        throw new Error("Failed to upload audio file");
      }

      // Create a transcription
      const transcript = await this.client.transcribe({
        audio_url: uploadResponse.upload_url,
      });

      // Poll for completion
      const result = await transcript.poll();

      if (result.status === 'error') {
        throw new Error(result.error || 'Transcription failed');
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