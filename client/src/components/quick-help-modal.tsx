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
        <Button variant="outline" size="icon">
          <HelpCircle className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Quick Help Guide</DialogTitle>
          <DialogDescription>
            Common transcription issues and their solutions
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {COMMON_ISSUES.map((issue, index) => (
              <div key={index} className="space-y-2">
                <h3 className="text-lg font-semibold">{issue.title}</h3>
                <p className="text-muted-foreground">{issue.description}</p>
                <ul className="list-disc pl-6 space-y-1">
                  {issue.solutions.map((solution, sIndex) => (
                    <li key={sIndex} className="text-sm">{solution}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
