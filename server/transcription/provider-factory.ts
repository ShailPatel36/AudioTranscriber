import { TranscriptionProvider, TranscriptionConfig } from "./providers/base";
import { OpenAIProvider } from "./providers/openai";
import { AssemblyAIProvider } from "./providers/assemblyai";
import { CommonVoiceProvider } from "./providers/commonvoice";

export class TranscriptionProviderFactory {
  private static providers: Record<string, TranscriptionProvider> = {};

  static getProvider(config: TranscriptionConfig): TranscriptionProvider {
    const { provider, apiKey } = config;

    // Return cached provider if exists
    if (this.providers[provider]) {
      return this.providers[provider];
    }

    // Create new provider instance
    switch (provider.toLowerCase()) {
      case "openai":
        if (!apiKey) throw new Error("OpenAI API key is required");
        this.providers[provider] = new OpenAIProvider(apiKey);
        break;
      case "assemblyai":
        if (!apiKey) throw new Error("AssemblyAI API key is required");
        this.providers[provider] = new AssemblyAIProvider(apiKey);
        break;
      case "commonvoice":
        this.providers[provider] = new CommonVoiceProvider();
        break;
      default:
        throw new Error(`Unsupported transcription provider: ${provider}`);
    }

    return this.providers[provider];
  }

  static getAvailableProviders(): string[] {
    return ["openai", "assemblyai", "commonvoice"];
  }
}