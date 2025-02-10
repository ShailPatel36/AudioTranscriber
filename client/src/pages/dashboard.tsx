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
import { Mic, Settings, History, LogOut, Wand2 } from "lucide-react";

export default function Dashboard() {
  const { user, logoutMutation } = useAuth();
  const [selectedTranscription, setSelectedTranscription] = useState<Transcription | null>(null);
  const [currentTranscription, setCurrentTranscription] = useState<Transcription | null>(null);

  const { data: transcriptions = [] } = useQuery<Transcription[]>({
    queryKey: ["/api/transcriptions"],
    refetchInterval: (data) => {
      return Array.isArray(data) && data.some((t) => t.status === "processing") ? 2000 : false;
    },
  });

  const sortedTranscriptions = [...transcriptions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

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
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Header with glass effect */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Mic className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              Transcriber Pro
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground flex items-center">
              <Wand2 className="w-4 h-4 mr-2" />
              {user?.username}
            </span>
            <QuickHelpModal />
            <Button
              variant="outline"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-bold mb-4">Transform Speech to Text</h2>
          <p className="text-muted-foreground text-lg mb-8">
            Upload audio files or paste YouTube links for instant, accurate transcriptions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-card rounded-lg shadow-lg border p-6">
              <Tabs defaultValue="upload" className="space-y-6">
                <TabsList className="grid grid-cols-2 gap-4 bg-muted p-1">
                  <TabsTrigger value="upload" className="flex items-center gap-2">
                    <Mic className="w-4 h-4" />
                    Upload
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Settings
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="upload" className="space-y-4">
                  <UploadForm />
                </TabsContent>
                <TabsContent value="settings">
                  <ProviderSettings />
                </TabsContent>
              </Tabs>
            </div>

            {/* Current Transcription */}
            {currentTranscription && (
              <div className="bg-card rounded-lg shadow-lg border p-6 space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  Current Transcription
                </h2>
                <TranscriptionResult transcription={currentTranscription} />
              </div>
            )}

            {/* Selected Transcription */}
            {selectedTranscription && selectedTranscription.id !== currentTranscription?.id && (
              <div className="bg-card rounded-lg shadow-lg border p-6 space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  Selected Transcription
                </h2>
                <TranscriptionResult transcription={selectedTranscription} />
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg shadow-lg border p-6">
              <TranscriptionHistory
                transcriptions={sortedTranscriptions}
                onSelect={setSelectedTranscription}
                selectedId={selectedTranscription?.id}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}