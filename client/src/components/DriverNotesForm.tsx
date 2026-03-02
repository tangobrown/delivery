import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { fileToBase64 } from "@/lib/utils";
import { Loader2, Send } from "lucide-react";

const DRIVER_NAMES = ["Andy", "Dan", "Ian", "Jakub", "Karol", "Lee"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface DriverNotesFormProps {
  postcode: string;
}

export function DriverNotesForm({ postcode }: DriverNotesFormProps) {
  const { toast } = useToast();
  const [driverName, setDriverName] = useState("");
  const [what3words, setWhat3words] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_FILE_SIZE) {
      toast({ variant: "destructive", title: "File too large", description: "Maximum file size is 10MB." });
      e.target.value = "";
      return;
    }
    setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName) {
      toast({ variant: "destructive", title: "Required", description: "Please select a driver name." });
      return;
    }
    if (!notes.trim()) {
      toast({ variant: "destructive", title: "Required", description: "Please enter notes." });
      return;
    }

    setIsSubmitting(true);
    try {
      let fileContent = "";
      let fileName = "";
      if (file) {
        fileContent = await fileToBase64(file);
        fileName = file.name;
      }

      await apiRequest("POST", "/api/driver-notes", {
        driverName,
        postcode,
        what3words: what3words.trim(),
        notes: notes.trim(),
        fileName,
        fileContent,
      });

      toast({ title: "Notes submitted", description: "Your delivery notes have been saved." });
      setDriverName("");
      setWhat3words("");
      setNotes("");
      setFile(null);
      // Reset file input
      const fileInput = document.getElementById(`file-${postcode}`) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4 border-t pt-4">
      <h3 className="font-semibold text-base">Submit Driver Notes</h3>

      <div className="space-y-1">
        <Label htmlFor={`driver-${postcode}`}>Driver Name *</Label>
        <Select value={driverName} onValueChange={setDriverName}>
          <SelectTrigger id={`driver-${postcode}`}>
            <SelectValue placeholder="Please select" />
          </SelectTrigger>
          <SelectContent>
            {DRIVER_NAMES.map((name) => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor={`w3w-${postcode}`}>What3Words (optional)</Label>
        <Input
          id={`w3w-${postcode}`}
          placeholder="e.g. filled.count.soap"
          value={what3words}
          onChange={(e) => setWhat3words(e.target.value)}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor={`notes-${postcode}`}>Additional Notes *</Label>
        <Textarea
          id={`notes-${postcode}`}
          placeholder="Enter delivery notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor={`file-${postcode}`}>File Attachment (optional, max 10MB)</Label>
        <Input
          id={`file-${postcode}`}
          type="file"
          onChange={handleFileChange}
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Submit Notes
          </>
        )}
      </Button>
    </form>
  );
}
