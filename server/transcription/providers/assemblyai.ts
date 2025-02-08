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

  private async waitForTranscription(id: string, maxAttempts = 30): Promise<any> {
    for (let i = 0; i < maxAttempts; i++) {
      const transcript = await this.client.transcript.get(id);

      if (transcript.status === 'completed') {
        return transcript;
      }

      if (transcript.status === 'error') {
        throw new Error(transcript.error || 'Transcription failed');
      }

      // Wait 2 seconds before next attempt
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error('Transcription timed out');
  }

  async transcribe(audio: Buffer, fileName: string): Promise<string> {
    try {
      // Upload the audio file
      const uploadUrl = await this.client.upload(audio);

      if (!uploadUrl) {
        throw new Error("Failed to upload audio file");
      }

      // Create a transcription
      const transcript = await this.client.transcript.create({
        audio_url: uploadUrl,
      });

      // Poll for completion
      const result = await this.waitForTranscription(transcript.id);

      return result.text || '';
    } catch (error: any) {
      throw new TranscriptionError(
        error.message || "Failed to transcribe with AssemblyAI",
        this.name
      );
    }
  }
}