import { TranscriptionProvider, TranscriptionError } from "./base";
import fetch from "node-fetch";

export class CommonVoiceProvider implements TranscriptionProvider {
  name = "commonvoice";
  private readonly API_URL = "https://commonvoice.mozilla.org/api/v1";

  async transcribe(audio: Buffer, fileName: string): Promise<string> {
    try {
      // Convert audio buffer to base64
      const base64Audio = audio.toString('base64');
      
      // Call the CommonVoice API
      const response = await fetch(`${this.API_URL}/transcribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio: base64Audio,
          language: 'en' // Default to English
        })
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.text || '';

    } catch (error: any) {
      throw new TranscriptionError(
        error.message || "Failed to transcribe with CommonVoice",
        this.name
      );
    }
  }
}
