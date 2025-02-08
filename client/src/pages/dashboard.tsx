import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Transcription } from "@shared/schema";
import UploadForm from "@/components/upload-form";
import TranscriptionHistory from "@/components/transcription-history";
import TranscriptionResult from "@/components/transcription-result";
import ProviderSettings from "@/components/provider-settings";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Dashboard() {
  const { user, logoutMutation } = useAuth();
  const [selectedTranscription, setSelectedTranscription] = useState<Transcription | null>(null);

  const { data: transcriptions = [] } = useQuery<Transcription[]>({
    queryKey: ["/api/transcriptions"],
    refetchInterval: (data = []) => data.some((t: Transcription) => t.status === "processing") ? 2000 : false,
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Transcriber</h1>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">
              Welcome, {user?.username}
            </span>
            <Button
              variant="outline"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Tabs defaultValue="upload">
              <TabsList>
                <TabsTrigger value="upload">Upload</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              <TabsContent value="upload">
                <UploadForm />
              </TabsContent>
              <TabsContent value="settings">
                <ProviderSettings />
              </TabsContent>
            </Tabs>

            {selectedTranscription && (
              <TranscriptionResult transcription={selectedTranscription} />
            )}
          </div>

          <div className="lg:col-span-1">
            <TranscriptionHistory
              transcriptions={transcriptions}
              onSelect={setSelectedTranscription}
              selectedId={selectedTranscription?.id}
            />
          </div>
        </div>
      </main>
    </div>
  );
}