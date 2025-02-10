import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Transcription } from "@shared/schema";
import UploadForm from "@/components/upload-form";
import TranscriptionHistory from "@/components/transcription-history";
import TranscriptionResult from "@/components/transcription-result";
import ProviderSettings from "@/components/provider-settings";
import QuickHelpModal from "@/components/quick-help-modal";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Dashboard() {
  const { user, logoutMutation } = useAuth();
  const [selectedTranscription, setSelectedTranscription] = useState<Transcription | null>(null);
  const [currentTranscription, setCurrentTranscription] = useState<Transcription | null>(null);

  const { data: transcriptions = [] } = useQuery<Transcription[]>({
    queryKey: ["/api/transcriptions"],
    refetchInterval: (data) => {
      if (!Array.isArray(data)) return false;
      return data.some((t) => t.status === "processing") ? 2000 : false;
    },
  });

  // Sort transcriptions by creation date (newest first)
  const sortedTranscriptions = [...transcriptions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Update current transcription when a new one is added
  useEffect(() => {
    if (sortedTranscriptions.length > 0) {
      const newest = sortedTranscriptions[0];
      if (!currentTranscription || 
          new Date(newest.createdAt).getTime() > 
          new Date(currentTranscription.createdAt).getTime()) {
        setCurrentTranscription(newest);
      }
    }
  }, [sortedTranscriptions]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Transcriber</h1>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">
              Welcome, {user?.username}
            </span>
            <QuickHelpModal />
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

            {/* Show current transcription */}
            {currentTranscription && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Current Transcription</h2>
                <TranscriptionResult transcription={currentTranscription} />
              </div>
            )}

            {/* Show selected transcription if different from current */}
            {selectedTranscription && selectedTranscription.id !== currentTranscription?.id && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Selected Transcription</h2>
                <TranscriptionResult transcription={selectedTranscription} />
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <TranscriptionHistory
              transcriptions={sortedTranscriptions}
              onSelect={setSelectedTranscription}
              selectedId={selectedTranscription?.id}
            />
          </div>
        </div>
      </main>
    </div>
  );
}