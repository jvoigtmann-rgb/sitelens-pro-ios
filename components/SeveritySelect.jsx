import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";

const OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

export default function SeveritySelect({ value, onChange }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const current = OPTIONS.find((o) => o.value === value);

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  if (!isMobile) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-xs border border-input rounded-md px-2 py-1 bg-background min-h-[44px]"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs min-h-[44px] gap-2">
          {current?.label || "Select"}
          <ChevronDown className="w-3 h-3" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Severity</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6 space-y-1">
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => handleSelect(o.value)}
              className={`w-full flex items-center justify-between min-h-[44px] px-3 rounded-lg text-sm ${
                value === o.value
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-muted"
              }`}
            >
              {o.label}
              {value === o.value && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}