"use client";

type LoadingScreenProps = {
  progress: number;
  status: "idle" | "loading" | "ready" | "error";
  error?: string | null;
};

export function LoadingScreen({ progress, status, error }: LoadingScreenProps) {
  const percent = Math.round(progress * 100);

  if (status === "ready") {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-neutral-950 text-white">
      <div className="w min-w-72 text-center">
        <p className="mb-4 text-xs uppercase tracking-[0.45em] text-white/50">CARÈNE</p>
        <p className="text-5xl font-semibold tabular-nums">{status === "error" ? "Erreur" : `${percent}%`}</p>
        <div className="mt-8 h-px overflow-hidden bg-white/15">
          <div className="h-full bg-white transition-transform duration-300" style={{ transform: `scaleX(${progress})`, transformOrigin: "left" }} />
        </div>
        {error ? <p className="mt-5 text-sm text-red-300">{error}</p> : null}
      </div>
    </div>
  );
}
