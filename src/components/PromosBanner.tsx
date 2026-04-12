import { useState, useEffect } from "react";
import { promos } from "../data/menu";

export default function PromosBanner() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % promos.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="promocoes" className="py-10 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900">🎁 Promoções do Dia</h2>
            <p className="text-gray-500 text-sm font-medium mt-0.5">Ofertas imperdíveis por tempo limitado!</p>
          </div>
          <div className="flex gap-2">
            {promos.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`h-2 rounded-full transition-all duration-300 ${i === active ? "w-8 bg-red-600" : "w-2 bg-gray-300"}`}
              />
            ))}
          </div>
        </div>

        {/* Promo cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {promos.map((promo, index) => (
            <div
              key={promo.id}
              onClick={() => setActive(index)}
              className={`relative overflow-hidden rounded-3xl p-6 cursor-pointer transition-all duration-300 bg-gradient-to-br ${promo.color} ${
                active === index
                  ? "scale-105 shadow-2xl ring-4 ring-white/50"
                  : "scale-100 shadow-lg opacity-85 hover:opacity-100 hover:scale-102"
              }`}
            >
              {/* Background decoration */}
              <div className="absolute -top-6 -right-6 text-8xl opacity-20 select-none">
                {promo.emoji}
              </div>
              <div className="absolute bottom-2 right-4 text-5xl opacity-30 select-none">
                {promo.emoji}
              </div>

              <div className="relative">
                {/* Discount badge */}
                <div className="inline-flex items-center bg-white/25 rounded-full px-3 py-1 mb-3">
                  <span className="text-white font-black text-sm">{promo.discount}</span>
                </div>
                <h3 className="text-white font-black text-xl leading-tight">{promo.title}</h3>
                <p className="text-white/80 text-sm font-semibold mt-1">{promo.subtitle}</p>

                <button className="mt-4 bg-white/20 hover:bg-white/30 border border-white/40 text-white font-bold text-sm px-4 py-2 rounded-xl transition-all inline-flex items-center gap-2">
                  Pegar oferta
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
