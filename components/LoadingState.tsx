"use client";

interface Props {
  message: string;
}

export function LoadingState({ message }: Props) {
  return (
    <div className="flex items-center gap-3 text-slate-400 py-4 animate-fade-in">
      <div className="flex gap-1">
        <span className="w-2 h-2 rounded-full bg-brand-400 animate-bounce"  style={{ animationDelay: "0ms" }}   />
        <span className="w-2 h-2 rounded-full bg-brand-400 animate-bounce"  style={{ animationDelay: "150ms" }} />
        <span className="w-2 h-2 rounded-full bg-brand-400 animate-bounce"  style={{ animationDelay: "300ms" }} />
      </div>
      <span className="text-sm">{message}</span>
    </div>
  );
}
