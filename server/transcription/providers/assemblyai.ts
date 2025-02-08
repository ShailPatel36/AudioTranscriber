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
      // First, create a temporary URL for the audio file
      const { url: uploadUrl } = await this.client.files.upload(audio, {
        fileName: fileName
      });

      // Create and wait for the transcript
      const transcript = await this.client.transcripts.transcribe({
        audio_url: uploadUrl,
        wait: true // This will wait for the transcript to complete
      });

      if (transcript.status === 'error') {
        throw new Error(transcript.error || 'Transcription failed');
      }

      return transcript.text || '';
    } catch (error: any) {
      throw new TranscriptionError(
        error.message || "Failed to transcribe with AssemblyAI",
        this.name
      );
    }
  }
}