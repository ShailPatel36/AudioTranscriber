export interface TranscriptionProvider {
  name: string;
  transcribe(audio: Buffer, fileName: string, options?: TranscriptionOptions): Promise<string>;
  supportsFeature?(feature: TranscriptionFeature): boolean;
}

export interface TranscriptionConfig {
  provider: string;
  apiKey?: string;
  language?: string;
  features?: TranscriptionFeature[];
}

export interface TranscriptionOptions {
  language?: string;
  features?: TranscriptionFeature[];
}

export enum TranscriptionFeature {
  LANGUAGE_DETECTION = "language_detection",
  TIMESTAMPS = "timestamps",
  SPEAKER_DIARIZATION = "speaker_diarization",
  NOISE_REDUCTION = "noise_reduction",
  CONFIDENCE_SCORES = "confidence_scores"
}

export class TranscriptionError extends Error {
  constructor(message: string, public provider: string) {
    super(message);
    this.name = 'TranscriptionError';
  }
}