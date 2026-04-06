"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";

const EXAMPLES = [
  "Should I travel to Japan in May 2026?",
  "Will there be a US recession in 2026?",
  "Is Bitcoin going to reach $200K?",
  "How risky is the Taiwan situation?",
  "Will there be a ceasefire in Ukraine?",
  "Is it a good time to invest in tech stocks?",
  "What are the odds of a major earthquake this year?",
  "Will inflation come back down in 2026?",
  "Is North Korea a real threat right now?",
  "Will Trump impose more tariffs on Japan?",
];

interface Props {
  onSubmit:  (question: string) => void;
  disabled?: boolean;
}

export function QueryForm({ onSubmit, disabled }: Props) {
  const [value,       setValue]       = useState("");
  const [placeholder, setPlaceholder] = useState(EXAMPLES[0]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Rotate placeholder every 4 seconds
  useEffect(() => {
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % EXAMPLES.length;
      setPlaceholder(EXAMPLES[idx]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = () => {
    const q = value.trim();
    if (!q || disabled) return;
    onSubmit(q);
  };

  const handleKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleExample = (ex: string) => {
    setValue(ex);
    textareaRef.current?.focus();
  };

  return (
    <div className="space-y-4">
      {/* Input */}
      <div className="relative group">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-brand-600/20 to-violet-600/20
                        blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <div className="relative flex items-end gap-3 rounded-2xl border border-slate-700
                        bg-slate-800/80 backdrop-blur-sm p-4
                        focus-within:border-brand-500/70 transition-colors duration-200">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKey}
            disabled={disabled}
            placeholder={placeholder}
            rows={2}
            className="flex-1 resize-none bg-transparent text-white placeholder-slate-500
                       text-base leading-relaxed outline-none
                       disabled:opacity-50 disabled:cursor-not-allowed
                       scrollbar-none"
            style={{ maxHeight: "8rem", overflowY: "auto" }}
          />
          <button
            onClick={handleSubmit}
            disabled={disabled || !value.trim()}
            className="shrink-0 px-5 py-2.5 rounded-xl font-semibold text-sm
                       bg-brand-600 hover:bg-brand-500 text-white
                       disabled:opacity-40 disabled:cursor-not-allowed
                       transition-all duration-150 active:scale-95"
          >
            {disabled ? "Analyzing…" : "Analyze"}
          </button>
        </div>
      </div>

      {/* Example chips */}
      <div className="flex flex-wrap gap-2">
        {EXAMPLES.slice(0, 5).map((ex) => (
          <button
            key={ex}
            onClick={() => handleExample(ex)}
            disabled={disabled}
            className="text-xs px-3 py-1.5 rounded-full border border-slate-700
                       text-slate-400 hover:text-white hover:border-slate-500
                       bg-slate-800/50 hover:bg-slate-800
                       transition-all duration-150 disabled:opacity-40
                       disabled:cursor-not-allowed truncate max-w-[220px]"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}
