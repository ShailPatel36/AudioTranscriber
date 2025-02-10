import { TranscriptionProvider, TranscriptionError } from "./base";
import fetch from "node-fetch";

export class AssemblyAIProvider implements TranscriptionProvider {
  name = "assemblyai";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async uploadAudio(audio: Buffer): Promise<string> {
    const response = await fetch("https://api.assemblyai.com/v2/upload", {
      method: "POST",
      headers: {
        "authorization": this.apiKey,
        "content-type": "application/octet-stream",
        "transfer-encoding": "chunked"
      },
      body: audio
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.upload_url;
  }

  private async waitForTranscription(id: string, maxAttempts = 30): Promise<string> {
    for (let i = 0; i < maxAttempts; i++) {
      const response = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, {
        headers: {
          "authorization": this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get transcript: ${response.statusText}`);
      }

      const transcript = await response.json();

      if (transcript.status === "completed") {
        return transcript.text;
      }

      if (transcript.status === "error") {
        throw new Error(transcript.error || "Transcription failed");
      }

      // Wait 2 seconds before next attempt
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error("Transcription timed out");
  }

  async transcribe(audio: Buffer, fileName: string): Promise<string> {
    try {
      // Upload the audio file
      const uploadUrl = await this.uploadAudio(audio);

      // Create transcription request
      const response = await fetch("https://api.assemblyai.com/v2/transcript", {
        method: "POST",
        headers: {
          "authorization": this.apiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          audio_url: uploadUrl
        })
      });

      if (!response.ok) {
        throw new Error(`Transcription request failed: ${response.statusText}`);
      }

      const transcription = await response.json();

      // Poll for completion
      const result = await this.waitForTranscription(transcription.id);
      return result;
    } catch (error: any) {
      console.error("AssemblyAI transcription error:", error);
      throw new TranscriptionError(
        error.message || "Failed to transcribe with AssemblyAI",
        this.name
      );
    }
  }
}