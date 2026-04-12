export default function Footer() {
  return (
    <footer className="bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-400 rounded-xl flex items-center justify-center">
                <span className="text-xl">🍔</span>
              </div>
              <span className="font-black text-2xl">
                Burguer<span className="text-red-500">Zap</span>
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              O melhor delivery de lanches da cidade! Sabor, qualidade e rapidez na sua porta.
            </p>
            <div className="flex items-center gap-2 mt-4">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-green-400 text-sm font-bold">Aberto agora • Seg–Dom 11h–23h</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-black text-base mb-4 text-white/90">Links Rápidos</h4>
            <ul className="space-y-2.5">
              {[
                { label: "🏠 Início", href: "#inicio" },
                { label: "🍽️ Cardápio", href: "#cardapio" },
                { label: "🎁 Promoções", href: "#promocoes" },
                { label: "ℹ️ Sobre Nós", href: "#sobre" },
              ].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-red-400 transition-colors text-sm font-semibold"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-black text-base mb-4 text-white/90">Contato & Redes</h4>
            <div className="space-y-3">
              <a
                href="https://wa.me/5511999999999"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-gray-400 hover:text-green-400 transition-colors text-sm font-semibold"
              >
                <div className="w-8 h-8 bg-green-600/20 rounded-lg flex items-center justify-center text-green-400">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.108.554 4.088 1.523 5.803L.057 23.998l6.345-1.44A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.65-.51-5.17-1.402l-.37-.22-3.773.857.9-3.678-.242-.378A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                  </svg>
                </div>
                (11) 99999-9999 · WhatsApp
              </a>

              <div className="flex items-center gap-3 text-gray-400 text-sm font-semibold">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">📍</div>
                Rua das Flores, 123 — Centro
              </div>

              <div className="flex items-center gap-3 text-gray-400 text-sm font-semibold">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">🕐</div>
                Seg–Dom • 11h às 23h
              </div>
            </div>

            {/* Social */}
            <div className="flex gap-3 mt-5">
              {[
                { label: "📸 Instagram", color: "hover:text-pink-400" },
                { label: "👥 Facebook", color: "hover:text-blue-400" },
                { label: "🎵 TikTok", color: "hover:text-purple-400" },
              ].map((s) => (
                <button
                  key={s.label}
                  className={`text-gray-500 ${s.color} text-xs font-bold bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl transition-all`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-500 font-semibold">
          <span>© 2024 MH Lanches. Todos os direitos reservados.</span>
          <div className="flex items-center gap-2">
            <span>Feito com</span>
            <span className="text-red-500">❤️</span>
            <span>para os famintos da cidade 🍔</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
