import OpenAI from "openai";
import { TranscriptionProvider, TranscriptionError, TranscriptionOptions, TranscriptionFeature } from "./base";
import path from "path";
import fs from "fs";
import os from "os";

export class OpenAIProvider implements TranscriptionProvider {
  name = "openai";
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async transcribe(audio: Buffer, fileName: string, options?: TranscriptionOptions): Promise<string> {
    let tempPath: string | null = null;

    try {
      // Create a temporary file with a proper extension
      const tempDir = os.tmpdir();
      tempPath = path.join(tempDir, `temp-${Date.now()}-${fileName}`);

      console.log("OpenAI: Writing audio to temporary file:", tempPath);
      await fs.promises.writeFile(tempPath, audio);

      // Create a ReadStream from the temporary file
      const fileStream = fs.createReadStream(tempPath);

      console.log("OpenAI: Calling Whisper API...");
      const response = await this.client.audio.transcriptions.create({
        file: fileStream,
        model: "whisper-1",
        language: options?.language,
      });

      let text = response.text;

      // If translation is requested, translate the text
      if (options?.translate?.enabled && options.translate.targetLanguage) {
        text = await this.translate(text, options.translate.targetLanguage);
      }

      console.log("OpenAI: Transcription/translation successful");
      return text;
    } catch (error: any) {
      console.error("OpenAI transcription error:", error);
      throw new TranscriptionError(
        error.message || "Failed to transcribe with OpenAI",
        this.name
      );
    } finally {
      // Clean up temp file
      if (tempPath) {
        await fs.promises.unlink(tempPath).catch(console.error);
      }
    }
  }

  async translate(text: string, targetLanguage: string): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a translator. Translate the following text to ${targetLanguage}. Maintain the original formatting and tone. Only respond with the translation, no explanations.`
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0.3
      });

      return response.choices[0].message.content || text;
    } catch (error: any) {
      console.error("OpenAI translation error:", error);
      throw new TranscriptionError(
        error.message || "Failed to translate with OpenAI",
        this.name
      );
    }
  }

  supportsFeature(feature: TranscriptionFeature): boolean {
    const supportedFeatures = [
      TranscriptionFeature.LANGUAGE_DETECTION,
      TranscriptionFeature.TRANSLATION
    ];
    return supportedFeatures.includes(feature);
  }
}