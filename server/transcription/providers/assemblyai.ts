import { TranscriptionProvider, TranscriptionError, TranscriptionOptions, TranscriptionFeature } from "./base";
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

  private async waitForTranscription(id: string, maxAttempts = 30): Promise<any> {
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
        return transcript;
      }

      if (transcript.status === "error") {
        throw new Error(transcript.error || "Transcription failed");
      }

      // Wait 2 seconds before next attempt
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error("Transcription timed out");
  }

  supportsFeature(feature: TranscriptionFeature): boolean {
    const supportedFeatures = [
      TranscriptionFeature.LANGUAGE_DETECTION,
      TranscriptionFeature.TIMESTAMPS,
      TranscriptionFeature.SPEAKER_DIARIZATION,
      TranscriptionFeature.CONFIDENCE_SCORES
    ];
    return supportedFeatures.includes(feature);
  }

  async transcribe(audio: Buffer, fileName: string, options?: TranscriptionOptions): Promise<string> {
    try {
      // Upload the audio file
      const uploadUrl = await this.uploadAudio(audio);

      // Create transcription request with enhanced options
      const transcriptionConfig: any = {
        audio_url: uploadUrl,
        auto_highlights: true,
        content_safety: true,
        entity_detection: true,
        auto_chapters: true
      };

      // Add optional features based on options
      if (options?.features?.includes(TranscriptionFeature.SPEAKER_DIARIZATION)) {
        transcriptionConfig.speaker_labels = true;
      }

      if (options?.features?.includes(TranscriptionFeature.LANGUAGE_DETECTION)) {
        transcriptionConfig.language_detection = true;
      } else if (options?.language) {
        transcriptionConfig.language_code = options.language;
      }

      if (options?.features?.includes(TranscriptionFeature.TIMESTAMPS)) {
        transcriptionConfig.word_boost = ["*"]; // Enable word-level timestamps
      }

      const response = await fetch("https://api.assemblyai.com/v2/transcript", {
        method: "POST",
        headers: {
          "authorization": this.apiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify(transcriptionConfig)
      });

      if (!response.ok) {
        throw new Error(`Transcription request failed: ${response.statusText}`);
      }

      const transcription = await response.json();
      const result = await this.waitForTranscription(transcription.id);

      // Format the output based on features
      let formattedText = "";

      if (options?.features?.includes(TranscriptionFeature.SPEAKER_DIARIZATION) && result.speaker_labels) {
        // Format with speaker labels
        let currentSpeaker = "";
        result.words.forEach((word: any) => {
          if (word.speaker !== currentSpeaker) {
            currentSpeaker = word.speaker;
            formattedText += `\n[Speaker ${currentSpeaker}]: `;
          }
          formattedText += word.text + " ";
        });
      } else {
        formattedText = result.text;
      }

      return formattedText.trim();
    } catch (error: any) {
      console.error("AssemblyAI transcription error:", error);
      throw new TranscriptionError(
        error.message || "Failed to transcribe with AssemblyAI",
        this.name
      );
    }
  }
}