import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import type { Transcription } from "@shared/schema";
import { Loader2, Download } from "lucide-react";

interface TranscriptionResultProps {
  transcription: Transcription;
}

export default function TranscriptionResult({ transcription }: TranscriptionResultProps) {
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
          <div className="py-8 flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p>Processing your media...</p>
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