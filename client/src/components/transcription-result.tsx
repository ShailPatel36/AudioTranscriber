import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import type { Transcription } from "@shared/schema";
import { Loader2, Download } from "lucide-react";
import { useEffect, useState } from "react";

const PROCESSING_MESSAGES = [
  "Converting your media to text...",
  "Using AI to understand the content...",
  "Almost there, finalizing transcription...",
  "Processing audio data...",
];

interface TranscriptionResultProps {
  transcription: Transcription;
}

export default function TranscriptionResult({ transcription }: TranscriptionResultProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  // Cycle through messages every 3 seconds during processing
  useEffect(() => {
    if (transcription.status === "processing") {
      const interval = setInterval(() => {
        setMessageIndex((current) => (current + 1) % PROCESSING_MESSAGES.length);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [transcription.status]);

  const handleExport = () => {
    if (!transcription.text) return;

    // Create blob with transcription text
    const blob = new Blob([transcription.text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    // Create download link
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcription-${transcription.id}.txt`;
    document.body.appendChild(a);
    a.click();

    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Transcription Result</CardTitle>
        {transcription.status === "completed" && transcription.text && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExport}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {transcription.status === "processing" ? (
          <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
              <Loader2 className="h-12 w-12 animate-spin relative" />
            </div>
            <p className="mt-8 text-center animate-pulse">
              {PROCESSING_MESSAGES[messageIndex]}
            </p>
            <p className="mt-2 text-sm text-muted-foreground/70">
              This may take a few minutes depending on the file size
            </p>
          </div>
        ) : transcription.status === "failed" ? (
          <div className="py-8 text-center text-destructive">
            <p>Transcription failed. Please try again.</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="prose prose-sm max-w-none">
              <p>{transcription.text}</p>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}