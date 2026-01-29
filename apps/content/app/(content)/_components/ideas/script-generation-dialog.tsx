"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Label,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
} from "@ratecreator/ui";
import { Loader2, FileText, Sparkles, Copy, Check } from "lucide-react";

interface ScriptGenerationDialogProps {
  open: boolean;
  onClose: () => void;
  ideaTitle: string;
  ideaDescription: string;
  outline?: string;
  topics: string[];
  onScriptGenerated: (script: string) => void;
}

const toneOptions = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "educational", label: "Educational" },
  { value: "storytelling", label: "Storytelling" },
];

const lengthOptions = [
  { value: "short", label: "Short (~1000 words)" },
  { value: "medium", label: "Medium (~1500-2000 words)" },
  { value: "long", label: "Long (~2500+ words)" },
];

export function ScriptGenerationDialog({
  open,
  onClose,
  ideaTitle,
  ideaDescription,
  outline,
  topics,
  onScriptGenerated,
}: ScriptGenerationDialogProps): JSX.Element {
  const [generating, setGenerating] = useState(false);
  const [tone, setTone] = useState("professional");
  const [length, setLength] = useState("medium");
  const [includeCode, setIncludeCode] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = (): void => {
    setGenerating(true);
    setGeneratedScript(null);

    fetch("/api/ai/generate-script", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: ideaTitle,
        description: ideaDescription,
        outline,
        topics,
        tone,
        targetLength: length,
        includeCodeExamples: includeCode,
      }),
    })
      .then((res) => res.json())
      .then((data: { script: string }) => {
        setGeneratedScript(data.script);
      })
      .catch(() => {
        // Handle error silently
      })
      .finally(() => {
        setGenerating(false);
      });
  };

  const handleUseScript = (): void => {
    if (generatedScript) {
      onScriptGenerated(generatedScript);
      onClose();
    }
  };

  const handleCopy = (): void => {
    if (generatedScript) {
      void navigator.clipboard.writeText(generatedScript);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  };

  const handleOpenChange = (openState: boolean): void => {
    if (!openState) {
      onClose();
      setGeneratedScript(null);
    }
  };

  const handleIncludeCodeChange = (checked: boolean): void => {
    setIncludeCode(checked);
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            Generate Blog Script
          </DialogTitle>
          <DialogDescription>
            Generate a complete blog post draft based on your idea
          </DialogDescription>
        </DialogHeader>

        {!generatedScript ? (
          <>
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{ideaTitle}</p>
                {ideaDescription ? (
                  <p className="text-sm text-muted-foreground mt-1">
                    {ideaDescription}
                  </p>
                ) : null}
                {topics.length > 0 ? (
                  <p className="text-xs text-muted-foreground mt-2">
                    Topics: {topics.join(", ")}
                  </p>
                ) : null}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Writing Tone</Label>
                  <Select onValueChange={setTone} value={tone}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {toneOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Target Length</Label>
                  <Select onValueChange={setLength} value={length}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select length" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {lengthOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <Label>Include Code Examples</Label>
                  <p className="text-sm text-muted-foreground">
                    Add code snippets where relevant
                  </p>
                </div>
                <Switch
                  checked={includeCode}
                  onCheckedChange={handleIncludeCodeChange}
                />
              </div>

              {outline ? (
                <div className="space-y-2">
                  <Label>Using Outline</Label>
                  <div className="p-3 bg-muted rounded-lg max-h-32 overflow-y-auto">
                    <pre className="text-xs whitespace-pre-wrap">{outline}</pre>
                  </div>
                </div>
              ) : null}
            </div>

            <DialogFooter>
              <Button onClick={onClose} variant="outline">
                Cancel
              </Button>
              <Button disabled={generating} onClick={handleGenerate}>
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Script
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto min-h-0 py-4">
              <div className="relative">
                <Button
                  className="absolute top-2 right-2"
                  onClick={handleCopy}
                  size="sm"
                  variant="ghost"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Textarea
                  className="min-h-[400px] font-mono text-sm"
                  readOnly
                  value={generatedScript}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={() => {
                  setGeneratedScript(null);
                }}
                variant="outline"
              >
                Regenerate
              </Button>
              <Button onClick={handleCopy} variant="outline">
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
              <Button onClick={handleUseScript}>
                <FileText className="h-4 w-4 mr-2" />
                Use Script
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
