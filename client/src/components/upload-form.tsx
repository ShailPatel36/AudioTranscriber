import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import type { TranscriptionSettings } from "@shared/schema";
import * as z from 'zod';

const PROVIDER_NAMES = {
  openai: "OpenAI Whisper",
  assemblyai: "AssemblyAI",
};

// Add supported file formats
const SUPPORTED_FORMATS = {
  audio: ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac'],
  video: ['.mp4', '.mov', '.avi', '.mkv', '.webm']
};

// Add file size limit (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function UploadForm() {
  const { toast } = useToast();
  const [uploadProgress, setUploadProgress] = useState(0);

  const { data: settings } = useQuery<TranscriptionSettings>({
    queryKey: ["/api/transcription-settings"],
  });

  const fileForm = useForm({
    defaultValues: {
      file: null as File | null,
    },
    resolver: zodResolver(
      z.object({
        file: z.custom<File>()
          .refine(file => file instanceof File, "Please select a file")
          .refine(
            file => file instanceof File && file.size <= MAX_FILE_SIZE,
            `File size must be less than ${formatBytes(MAX_FILE_SIZE)}`
          )
          .refine(
            file => {
              if (!(file instanceof File)) return false;
              const ext = '.' + file.name.split('.').pop()?.toLowerCase();
              return [...SUPPORTED_FORMATS.audio, ...SUPPORTED_FORMATS.video].includes(ext);
            },
            `Unsupported file format. Supported formats: ${[...SUPPORTED_FORMATS.audio, ...SUPPORTED_FORMATS.video].join(', ')}`
          ),
      })
    ),
  });

  const youtubeForm = useForm({
    defaultValues: {
      url: "",
    },
  });

  const fileUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/transcribe/file", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(errorData.message || "Failed to upload file");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transcriptions"] });
      toast({
        title: "Success",
        description: "File uploaded and processing started",
      });
      fileForm.reset();
      setUploadProgress(0);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
      setUploadProgress(0);
    },
  });

  const youtubeMutation = useMutation({
    mutationFn: async (data: { url: string }) => {
      const res = await apiRequest("POST", "/api/transcribe/youtube", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transcriptions"] });
      toast({
        title: "Success",
        description: "YouTube video processing started",
      });
      youtubeForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Processing Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const provider = settings?.provider || "openai";
  const providerName = PROVIDER_NAMES[provider as keyof typeof PROVIDER_NAMES] || provider;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Upload Media</span>
          <span className="text-sm font-normal text-muted-foreground">
            Using {providerName}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="file">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file">File Upload</TabsTrigger>
            <TabsTrigger value="youtube">YouTube URL</TabsTrigger>
          </TabsList>

          <TabsContent value="file">
            <Form {...fileForm}>
              <form 
                onSubmit={fileForm.handleSubmit((data) => {
                  if (data.file) fileUploadMutation.mutate(data.file);
                })}
                className="space-y-4"
              >
                <FormField
                  control={fileForm.control}
                  name="file"
                  render={({ field: { onChange }, fieldState: { error } }) => (
                    <FormItem>
                      <FormLabel>Audio/Video File</FormLabel>
                      <div className="space-y-2">
                        <FormControl>
                          <Input
                            type="file"
                            accept={[...SUPPORTED_FORMATS.audio, ...SUPPORTED_FORMATS.video].join(',')}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) onChange(file);
                            }}
                          />
                        </FormControl>
                        {error && <FormMessage>{error.message}</FormMessage>}
                        <p className="text-sm text-muted-foreground">
                          Maximum file size: {formatBytes(MAX_FILE_SIZE)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Supported formats:{' '}
                          <span className="font-mono">
                            {[...SUPPORTED_FORMATS.audio, ...SUPPORTED_FORMATS.video].join(', ')}
                          </span>
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  disabled={!fileForm.watch("file") || fileUploadMutation.isPending}
                  className="w-full"
                >
                  {fileUploadMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Upload File
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="youtube">
            <Form {...youtubeForm}>
              <form 
                onSubmit={youtubeForm.handleSubmit((data) => youtubeMutation.mutate(data))}
                className="space-y-4"
              >
                <FormField
                  control={youtubeForm.control}
                  name="url"
                  render={({ field, fieldState: { error } }) => (
                    <FormItem>
                      <FormLabel>YouTube URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://youtube.com/..." />
                      </FormControl>
                      {error && <FormMessage>{error.message}</FormMessage>}
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  disabled={!youtubeForm.watch("url") || youtubeMutation.isPending}
                  className="w-full"
                >
                  {youtubeMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Process YouTube Video
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}