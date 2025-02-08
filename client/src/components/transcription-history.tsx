import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Transcription } from "@shared/schema";
import { format } from "date-fns";
import { FileText, Youtube } from "lucide-react";
import { cn } from "@/lib/utils";

interface TranscriptionHistoryProps {
  transcriptions: Transcription[];
  onSelect: (transcription: Transcription) => void;
  selectedId?: number;
}

export default function TranscriptionHistory({
  transcriptions,
  onSelect,
  selectedId,
}: TranscriptionHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>History</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {transcriptions.map((transcription) => (
              <div
                key={transcription.id}
                className={cn(
                  "p-4 rounded-lg border cursor-pointer transition-colors",
                  selectedId === transcription.id
                    ? "bg-primary/5 border-primary"
                    : "hover:bg-muted"
                )}
                onClick={() => onSelect(transcription)}
              >
                <div className="flex items-start gap-3">
                  {transcription.sourceType === "youtube" ? (
                    <Youtube className="h-5 w-5 mt-1 text-red-500" />
                  ) : (
                    <FileText className="h-5 w-5 mt-1 text-blue-500" />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {transcription.sourceType === "youtube"
                        ? transcription.sourceUrl
                        : transcription.fileName}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <span>
                        {format(new Date(transcription.createdAt), "MMM d, yyyy")}
                      </span>
                      <span>•</span>
                      <span className="capitalize">{transcription.status}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {transcriptions.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No transcriptions yet
              </p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
