import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import type { TranscriptionSettings } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const PROVIDERS = [
  { id: "openai", name: "OpenAI Whisper" },
  { id: "assemblyai", name: "AssemblyAI" },
  { id: "commonvoice", name: "Mozilla CommonVoice (Free)" },
];

const LANGUAGES = [
  { code: "auto", name: "Auto Detect" },
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "nl", name: "Dutch" },
  { code: "hi", name: "Hindi" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh", name: "Chinese" },
];

const settingsSchema = z.object({
  provider: z.enum(["openai", "assemblyai", "commonvoice"] as const),
  openaiKey: z.string().optional(),
  assemblyaiKey: z.string().optional(),
  defaultLanguage: z.string().optional(),
  enableSpeakerDiarization: z.boolean().optional(),
  enableTimestamps: z.boolean().optional(),
  enableLanguageDetection: z.boolean().optional(),
  enableNoiseReduction: z.boolean().optional(),
  enableConfidenceScores: z.boolean().optional(),
}).refine((data) => {
  if (data.provider === "openai") {
    return !!data.openaiKey;
  }
  if (data.provider === "assemblyai") {
    return !!data.assemblyaiKey;
  }
  return true;
}, {
  message: "API key is required for the selected provider",
  path: ["provider"],
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function ProviderSettings() {
  const { toast } = useToast();

  const { data: settings } = useQuery<TranscriptionSettings>({
    queryKey: ["/api/transcription-settings"],
  });

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      provider: settings?.provider as "openai" | "assemblyai" | "commonvoice" || "openai",
      openaiKey: settings?.openaiKey || "",
      assemblyaiKey: settings?.assemblyaiKey || "",
      defaultLanguage: settings?.defaultLanguage || "auto",
      enableSpeakerDiarization: settings?.enableSpeakerDiarization || false,
      enableTimestamps: settings?.enableTimestamps || false,
      enableLanguageDetection: settings?.enableLanguageDetection || false,
      enableNoiseReduction: settings?.enableNoiseReduction || false,
      enableConfidenceScores: settings?.enableConfidenceScores || false,
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: SettingsFormData) => {
      const res = await apiRequest("POST", "/api/transcription-settings", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/transcription-settings"], data);
      toast({
        title: "Settings Updated",
        description: "Your transcription settings have been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const selectedProvider = form.watch("provider");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transcription Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => updateMutation.mutate(data))}
            className="space-y-6"
          >
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transcription Provider</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a provider" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PROVIDERS.map((provider) => (
                          <SelectItem key={provider.id} value={provider.id}>
                            {provider.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedProvider === "openai" && (
                <FormField
                  control={form.control}
                  name="openaiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>OpenAI API Key</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {selectedProvider === "assemblyai" && (
                <FormField
                  control={form.control}
                  name="assemblyaiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>AssemblyAI API Key</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="defaultLanguage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Language</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a language" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LANGUAGES.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            {lang.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-medium mb-2">Advanced Features</h3>

                <FormField
                  control={form.control}
                  name="enableSpeakerDiarization"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Speaker Diarization</FormLabel>
                        <FormDescription>
                          Identify and label different speakers in the audio
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="enableTimestamps"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Word-Level Timestamps</FormLabel>
                        <FormDescription>
                          Add precise timing information for each word
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="enableLanguageDetection"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Auto Language Detection</FormLabel>
                        <FormDescription>
                          Automatically detect the spoken language
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="enableNoiseReduction"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Noise Reduction</FormLabel>
                        <FormDescription>
                          Reduce background noise for better accuracy
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="enableConfidenceScores"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <div>
                        <FormLabel>Confidence Scores</FormLabel>
                        <FormDescription>
                          Show confidence level for each transcribed segment
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Settings
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}