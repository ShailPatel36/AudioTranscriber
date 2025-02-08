export interface TranscriptionProvider {
  name: string;
  transcribe(audio: Buffer, fileName: string): Promise<string>;
}

export interface TranscriptionConfig {
  provider: string;
  apiKey?: string;
}

export class TranscriptionError extends Error {
  constructor(message: string, public provider: string) {
    super(message);
    this.name = 'TranscriptionError';
  }
}
