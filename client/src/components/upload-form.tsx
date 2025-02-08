import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";

export default function UploadForm() {
  const { toast } = useToast();
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileForm = useForm({
    defaultValues: {
      file: null as File | null,
    },
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
      
      if (!res.ok) throw new Error(await res.text());
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
        title: "Error",
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
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Media</CardTitle>
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
                  render={({ field: { onChange } }) => (
                    <FormItem>
                      <FormLabel>Audio/Video File</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept=".mp3,video/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) onChange(file);
                          }}
                        />
                      </FormControl>
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
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>YouTube URL</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://youtube.com/..." />
                      </FormControl>
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
