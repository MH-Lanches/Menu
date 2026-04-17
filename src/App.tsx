import { useEffect, useState } from "react";
import Site from "./site/Site";
import Admin from "./admin/Admin";
import Pdv from "./pdv/Pdv";
import { applyTheme, getConfig } from "./store";

function getRoute(): string {
  const h = window.location.hash || "#/site";
  if (h.startsWith("#/admin")) return "admin";
  if (h.startsWith("#/pdv")) return "pdv";
  return "site";
}

export default function App() {
  const [route, setRoute] = useState(getRoute());

  useEffect(() => {
    applyTheme(getConfig());
    const onHash = () => setRoute(getRoute());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Mostrar landing apenas se não houver hash
  if (!window.location.hash) {
    return <Landing />;
  }

  if (route === "admin") return <Admin />;
  if (route === "pdv") return <Pdv />;
  return <Site />;
}

function Landing() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <div className="orbs">
        <div className="orb a" />
        <div className="orb b" />
      </div>
      <div className="relative z-10 max-w-3xl w-full">
        <div className="text-center mb-8">
          <img
            src="https://firebasestorage.googleapis.com/v0/b/cardapiomhlanches.firebasestorage.app/o/produtos%2FMH%20Lanches%20logo%20site.png?alt=media&token=a474e687-dd64-4560-86df-0f1bf0be4572"
            className="logo-hero w-40 mx-auto"
          />
          <h1 className="text-5xl font-black gradient-text mt-4">MH Lanches ERP</h1>
          <p className="text-white/60 mt-2">Sistema completo de delivery — Site • Admin • PDV</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="#/site" className="card p-6 text-center hover:border-orange-500/50">
            <div className="text-5xl mb-3">🌐</div>
            <h2 className="text-xl font-black gradient-text">Site Cliente</h2>
            <p className="text-white/60 text-sm mt-1">Cardápio público para pedidos via WhatsApp</p>
          </a>
          <a href="#/admin" className="card p-6 text-center hover:border-cyan-400/50">
            <div className="text-5xl mb-3">⚙️</div>
            <h2 className="text-xl font-black gradient-text-cyan">Admin</h2>
            <p className="text-white/60 text-sm mt-1">Produtos, cupons, relatórios e configurações</p>
            <p className="text-xs text-white/40 mt-2">admin / admin123</p>
          </a>
          <a href="#/pdv" className="card p-6 text-center hover:border-orange-500/50">
            <div className="text-5xl mb-3">💰</div>
            <h2 className="text-xl font-black gradient-text">PDV</h2>
            <p className="text-white/60 text-sm mt-1">Operação ao vivo: Delivery, Mesas, Balcão</p>
          </a>
        </div>
        <p className="text-center text-white/30 text-xs mt-8">
          💡 Os dados são salvos no navegador (localStorage) e sincronizam entre abas em tempo real.
        </p>
      </div>
    </div>
  );
}
