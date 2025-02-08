import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Transcription } from "@shared/schema";
import { Loader2 } from "lucide-react";

interface TranscriptionResultProps {
  transcription: Transcription;
}

export default function TranscriptionResult({ transcription }: TranscriptionResultProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transcription Result</CardTitle>
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
