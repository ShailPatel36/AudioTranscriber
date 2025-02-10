import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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

const settingsSchema = z.object({
  provider: z.enum(["openai", "assemblyai", "commonvoice"]),
  openaiKey: z.string().min(1, "OpenAI API key is required when using OpenAI").optional(),
  assemblyaiKey: z.string().min(1, "AssemblyAI API key is required when using AssemblyAI").optional(),
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
      provider: settings?.provider || "openai",
      openaiKey: settings?.openaiKey || "",
      assemblyaiKey: settings?.assemblyaiKey || "",
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
            className="space-y-4"
          >
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

            {(selectedProvider === "openai" || selectedProvider === undefined) && (
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

            {selectedProvider === "commonvoice" && (
              <FormField
                control={form.control}
                name="commonvoiceKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CommonVoice API Key</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}


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