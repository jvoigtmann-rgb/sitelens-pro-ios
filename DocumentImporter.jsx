import { useState, useRef } from "react";
import { Upload, Loader2, FileText, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";

export default function DocumentImporter({ onImported }) {
  const [status, setStatus] = useState("idle"); // idle | uploading | extracting | done | error
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    setStatus("uploading");
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setStatus("extracting");

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a real estate document analyst. Extract the following structured sections from this document.
For each section, write a clean, professional narrative (not bullet points unless the original uses them).
If a section isn't present, return an empty string for it.`,
      file_urls: [file_url],
      response_json_schema: {
        type: "object",
        properties: {
          executive_summary: { type: "string", description: "Overall executive summary or introduction" },
          operations_summary: { type: "string", description: "Operations & physical building section including staffing, HVAC, systems, maintenance" },
          building_summary: { type: "string", description: "Condition observations covering facade, roof, parking, MEP, site, interiors" },
        },
      },
    });

    setStatus("done");
    onImported(result);
    setTimeout(() => setStatus("idle"), 3000);
  };

  const labels = {
    idle: null,
    uploading: "Uploading document...",
    extracting: "Extracting notes with AI...",
    done: "Notes imported!",
    error: "Error — try again",
  };

  return (
    <div className="flex items-center gap-3">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.doc,.txt"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />
      <Button
        variant="outline"
        size="sm"
        className="gap-2 rounded-xl"
        onClick={() => fileInputRef.current?.click()}
        disabled={status === "uploading" || status === "extracting"}
      >
        {status === "uploading" || status === "extracting" ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : status === "done" ? (
          <Check className="w-4 h-4 text-green-600" />
        ) : (
          <Upload className="w-4 h-4" />
        )}
        {status === "idle" ? "Import Notes from Document" : labels[status]}
      </Button>
    </div>
  );
}