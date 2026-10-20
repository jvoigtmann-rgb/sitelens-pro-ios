import { useRef } from "react";
import { Mic, MicOff } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import useSpeechInput from "@/hooks/useSpeechInput";

/**
 * A drop-in replacement for <Textarea> with a mic button for speech-to-text.
 * Appends transcribed text to the current value.
 */
export default function VoiceTextArea({ value, onChange, className, ...props }) {
  const handleResult = (transcript) => {
    const separator = value && !value.endsWith(" ") && !value.endsWith("\n") ? " " : "";
    onChange({ target: { value: value + separator + transcript } });
  };

  const { listening, toggle, isSupported } = useSpeechInput(handleResult);

  return (
    <div className="relative">
      <Textarea
        value={value}
        onChange={onChange}
        className={`pr-10 ${className || ""}`}
        {...props}
      />
      {isSupported && (
        <button
          type="button"
          onClick={toggle}
          className={`absolute bottom-2 right-2 p-1.5 rounded-full transition-colors ${
            listening
              ? "bg-red-100 text-red-600 hover:bg-red-200 animate-pulse"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
          title={listening ? "Stop recording" : "Speak to type"}
        >
          {listening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
        </button>
      )}
    </div>
  );
}