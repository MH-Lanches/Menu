import { useEffect, useState } from "react";
import { useStore } from "../store";

export type Route = "site" | "admin" | "pdv";

/** Helpers de cor — aceita #rrggbb e devolve "r,g,b" para uso em rgba() */
function hexToRgb(hex: string): string {
  const h = hex.replace("#", "").trim();
  if (h.length === 3) {
    const r = parseInt(h[0] + h[0], 16);
    const g = parseInt(h[1] + h[1], 16);
    const b = parseInt(h[2] + h[2], 16);
    return `${r},${g},${b}`;
  }
  if (h.length === 6) {
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `${r},${g},${b}`;
  }
  return "255,107,53";
}

/** Aplica as cores configuradas em CSS vars no :root, dinamicamente. */
export function ThemeApplier() {
  const { config } = useStore();
  useEffect(() => {
    const v = config.visual;
    const root = document.documentElement;
    const set = (k: string, val: string) => root.style.setProperty(k, val);
    set("--mh-primary", v.corPrimaria);
    set("--mh-primary-rgb", hexToRgb(v.corPrimaria));
    set("--mh-secondary", v.corSecundaria);
    set("--mh-secondary-rgb", hexToRgb(v.corSecundaria));
    set("--mh-accent", v.corDestaque);
    set("--mh-accent-rgb", hexToRgb(v.corDestaque));
    set("--mh-bg", v.corFundo);
    set("--mh-card", v.corFundoCard);
    set("--mh-header", v.corFundoHeader);
    set("--mh-text", v.corTexto);
    set("--mh-text-soft", v.corTextoSuave);
    set("--mh-btn", v.corBotao);
    set("--mh-btn-end", v.corBotaoFim);
    set("--mh-btn-text", v.corBotaoTexto);
    set("--mh-ghost-bg", v.corBotaoGhostBg);
    set("--mh-ghost-text", v.corBotaoGhostTexto);
    set("--mh-success", v.corSucesso);
    set("--mh-danger", v.corPerigo);
    set("--mh-warn", v.corAviso);
    set("--mh-info", v.corInfo);
    set("--mh-border", v.corBorda);
    set("--mh-radius", `${v.raioBorda}px`);
    document.body.style.background = v.corFundo;
    document.body.style.color = v.corTexto;
  }, [config.visual]);
  return null;
}

export function useRoute(): [Route, (r: Route) => void] {
  const parse = (): Route => {
    const h = window.location.hash.replace("#/", "").replace("#", "");
    if (h === "admin") return "admin";
    if (h === "pdv") return "pdv";
    return "site";
  };
  const [r, setR] = useState<Route>(parse());
  useEffect(() => {
    const onHash = () => setR(parse());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const set = (n: Route) => { window.location.hash = "#/" + n; setR(n); };
  return [r, set];
}

export function TopSwitcher({ route, setRoute }: { route: Route; setRoute: (r: Route) => void }) {
  return (
    <div className="fixed top-3 right-3 z-50 glass-strong px-2 py-2 flex gap-1 text-xs">
      {(["site","admin","pdv"] as Route[]).map(r => (
        <button key={r}
          onClick={() => setRoute(r)}
          style={route === r ? { background: "linear-gradient(135deg, var(--mh-btn), var(--mh-btn-end))", color: "var(--mh-btn-text)" } : undefined}
          className={"px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition " +
            (route === r ? "shadow-lg" : "text-white/60 hover:text-white hover:bg-white/5")}>
          {r === "site" ? "🛒 Site" : r === "admin" ? "⚙️ Admin" : "💰 PDV"}
        </button>
      ))}
    </div>
  );
}

export function Logo({ size = 44 }: { size?: number }) {
  const { config } = useStore();
  const logo = config.visual?.logoUrl?.trim();

  // Atualiza favicon dinamicamente conforme logo configurado no admin
  useEffect(() => {
    if (!logo) return;
    let link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = logo;
  }, [logo]);

  return (
    <div className="flex items-center gap-3">
      <div className="logo-anim relative" style={{ width: size, height: size }}>
        {logo ? (
          <img
            src={logo}
            alt={config.loja.nome}
            className="absolute inset-0 w-full h-full object-contain rounded-2xl"
            style={{ filter: "drop-shadow(0 0 12px rgba(var(--mh-primary-rgb), 0.5))" }}
          />
        ) : (
          <div className="absolute inset-0 rounded-2xl flex items-center justify-center text-2xl"
            style={{
              background: "linear-gradient(135deg, var(--mh-primary), var(--mh-accent))",
              boxShadow: "0 0 30px rgba(var(--mh-primary-rgb), 0.6)",
            }}>
            🍔
          </div>
        )}
      </div>
      <div className="leading-tight">
        <div className="text-lg font-extrabold neon-text-orange">{config.loja.nome}</div>
        <div className="text-[10px] text-white/60 uppercase tracking-widest">{config.loja.slogan}</div>
      </div>
    </div>
  );
}
