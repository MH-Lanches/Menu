import { ReactNode, useEffect } from "react";

export function Orbs() {
  return (
    <div className="orbs">
      <div className="orb a" />
      <div className="orb b" />
    </div>
  );
}

export function Modal({ open, onClose, children, max = "max-w-2xl" }: { open: boolean; onClose: () => void; children: ReactNode; max?: string }) {
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal-card ${max}`} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export function Badge({ children, color = "primary" }: { children: ReactNode; color?: "primary" | "accent" | "success" | "danger" | "warn" }) {
  const colors: Record<string, string> = {
    primary: "bg-orange-500/20 text-orange-300 border-orange-500/40",
    accent: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    success: "bg-green-500/20 text-green-300 border-green-500/40",
    danger: "bg-red-500/20 text-red-300 border-red-500/40",
    warn: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full border ${colors[color]}`}>{children}</span>;
}

export function Toast({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] glass-strong px-5 py-3 rounded-full border-orange-500/40 shadow-neon">
      <span className="text-sm font-semibold">{msg}</span>
    </div>
  );
}
