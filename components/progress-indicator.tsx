"use client";

type ProgressIndicatorProps = {
  progress: number;
};

export function ProgressIndicator({ progress }: ProgressIndicatorProps) {
  return (
    <div className="fixed bottom-8 left-1/2 z-30 h-px w-48 -translate-x-1/2 overflow-hidden bg-white/20" aria-hidden="true">
      <div className="h-full bg-white" style={{ transform: `scaleX(${progress})`, transformOrigin: "left" }} />
    </div>
  );
}
