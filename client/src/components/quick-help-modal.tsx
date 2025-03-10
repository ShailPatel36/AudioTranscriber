import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HelpCircle } from "lucide-react";

const COMMON_ISSUES = [
  {
    title: "File Upload Failed",
    description: "If your file upload fails, ensure:",
    solutions: [
      "File is in MP3 or common video format",
      "File size is under 50MB",
      "You have a stable internet connection",
      "You're logged in to your account"
    ]
  },
  {
    title: "Transcription Stuck Processing",
    description: "If your transcription is stuck processing:",
    solutions: [
      "Wait a few minutes as large files take longer to process",
      "Check if you've configured the API key for your selected provider",
      "Try switching to a different transcription provider",
      "Refresh the page to see if the status updates"
    ]
  },
  {
    title: "Poor Transcription Quality",
    description: "To improve transcription quality:",
    solutions: [
      "Ensure the audio is clear with minimal background noise",
      "Try using a different transcription provider",
      "For non-English content, consider using providers with multi-language support",
      "Check if the audio file isn't corrupted"
    ]
  },
  {
    title: "API Key Issues",
    description: "If you're having problems with API keys:",
    solutions: [
      "Verify you've entered the correct API key in settings",
      "Ensure you have sufficient credits/quota with the provider",
      "Try the CommonVoice provider which doesn't require an API key",
      "Check if your API key has the necessary permissions"
    ]
  }
];

export default function QuickHelpModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="hover:bg-accent">
          <HelpCircle className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-2xl">Quick Help Guide</DialogTitle>
          <DialogDescription>
            Common transcription issues and their solutions
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="mt-4 max-h-[60vh] pr-6">
          <div className="space-y-8">
            {COMMON_ISSUES.map((issue, index) => (
              <div 
                key={index} 
                className="p-4 rounded-lg bg-card border"
              >
                <h3 className="text-xl font-semibold mb-2 text-primary">
                  {issue.title}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {issue.description}
                </p>
                <div className="space-y-2">
                  {issue.solutions.map((solution, sIndex) => (
                    <div 
                      key={sIndex} 
                      className="flex items-start gap-2 text-sm"
                    >
                      <span className="text-primary mt-1">•</span>
                      <span>{solution}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}