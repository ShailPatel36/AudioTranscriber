import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Transcription } from "@shared/schema";
import { Loader2, Download, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { formatTranscriptionForExport, type ExportFormat } from "@/lib/export-utils";

const PROCESSING_MESSAGES = [
  "Converting your media to text...",
  "Using AI to understand the content...",
  "Almost there, finalizing transcription...",
  "Processing audio data...",
];

interface TranscriptionResultProps {
  transcription: Transcription;
}

function formatTranscriptionText(text: string | null): string[] {
  if (!text) return [];

  // Split text into paragraphs based on double line breaks or multiple line breaks
  return text
    .split(/\n\s*\n/)
    .map(paragraph => paragraph.trim())
    .filter(paragraph => paragraph.length > 0);
}

export default function TranscriptionResult({ transcription }: TranscriptionResultProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [formattedText, setFormattedText] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  // Format text when transcription changes
  useEffect(() => {
    if (transcription.text) {
      setFormattedText(formatTranscriptionText(transcription.text));
    }
  }, [transcription.text]);

  // Cycle through messages every 3 seconds during processing
  useEffect(() => {
    if (transcription.status === "processing") {
      const interval = setInterval(() => {
        setMessageIndex((current) => (current + 1) % PROCESSING_MESSAGES.length);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [transcription.status]);

  const handleExport = async (format: ExportFormat) => {
    if (!transcription.text) return;

    try {
      setIsExporting(true);

      const blob = await formatTranscriptionForExport(
        transcription.text,
        format,
        {
          title: transcription.sourceType === "youtube" 
            ? transcription.sourceUrl 
            : transcription.fileName,
          date: new Date(transcription.createdAt)
        }
      );

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcription-${transcription.id}.${format}`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Transcription Result</CardTitle>
        {transcription.status === "completed" && transcription.text && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline"
                size="sm"
                disabled={isExporting}
                className="flex items-center gap-2"
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Export
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("txt")}>
                Plain Text (.txt)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("srt")}>
                Subtitles (.srt)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("pdf")}>
                PDF Document (.pdf)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
            <div className="prose prose-sm max-w-none space-y-4">
              {formattedText.map((paragraph, index) => (
                <p key={index} className="leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}