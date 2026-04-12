export default function Hero() {
  return (
    <section
      id="inicio"
      className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-gray-950 via-red-950 to-gray-900 pt-16"
    >
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-900/10 rounded-full blur-3xl"></div>
        {/* Dotted grid */}
        <div className="absolute inset-0 opacity-20 dot-pattern"></div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <div className="animate-slide-left space-y-6 text-center lg:text-left">
          {/* Status badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white rounded-full px-4 py-2 text-sm font-semibold backdrop-blur-sm">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Aberto • Entrega em até 30 min
            <span className="text-green-400">🛵</span>
          </div>

          {/* Main title */}
          <h1 className="text-5xl lg:text-7xl font-black text-white leading-tight">
            O MELHOR
            <br />
            <span className="gradient-text">LANCHE</span>
            <br />
            <span className="text-white/90">DA CIDADE!</span>
          </h1>

          <p className="text-white/70 text-lg leading-relaxed max-w-md mx-auto lg:mx-0">
            Burgers artesanais, hot dogs gourmet, pizzas irresistíveis e muito mais.
            <span className="text-yellow-400 font-bold"> Peça agora</span> e receba na sua porta! 🔥
          </p>

          {/* Stats row */}
          <div className="flex items-center justify-center lg:justify-start gap-6">
            {[
              { value: "4.9★", label: "Avaliação" },
              { value: "30min", label: "Entrega" },
              { value: "+2k", label: "Pedidos" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-black text-white">{stat.value}</div>
                <div className="text-xs text-white/50 font-semibold">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <a
              href="#cardapio"
              className="btn-shine inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-black py-4 px-8 rounded-2xl text-lg shadow-2xl shadow-red-600/40 transition-all hover:scale-105 hover:shadow-red-600/60"
            >
              <span>Ver Cardápio</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
            <a
              href="#promocoes"
              className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/30 hover:bg-white/20 text-white font-bold py-4 px-8 rounded-2xl text-lg backdrop-blur-sm transition-all hover:scale-105"
            >
              <span>🎁</span>
              <span>Promoções</span>
            </a>
          </div>

          {/* Payment methods */}
          <div className="flex items-center justify-center lg:justify-start gap-3 text-white/50 text-xs font-semibold">
            <span>Aceita:</span>
            {["💳 Crédito", "💵 Débito", "🔵 Pix", "💰 Dinheiro"].map((m) => (
              <span key={m} className="bg-white/10 px-2 py-1 rounded-lg">{m}</span>
            ))}
          </div>
        </div>

        {/* Right — Hero Image */}
        <div className="relative flex items-center justify-center animate-slide-right">
          {/* Glowing ring behind burger */}
          <div className="absolute w-72 h-72 lg:w-96 lg:h-96 rounded-full bg-gradient-to-br from-red-600/40 to-orange-500/30 blur-2xl"></div>
          <div className="absolute w-64 h-64 lg:w-80 lg:h-80 rounded-full border-2 border-red-500/20 animate-spin-slow"></div>

          <div className="relative animate-float">
            <img
              src="/images/hero-burger.png"
              alt="Smash Burger Delicioso"
              className="w-72 h-72 lg:w-[440px] lg:h-[440px] object-contain drop-shadow-2xl"
            />
          </div>

          {/* Floating info cards */}
          <div className="absolute top-4 -left-4 lg:-left-10 glass rounded-2xl px-4 py-3 shadow-xl border border-white/30 animate-float-delay">
            <div className="text-2xl font-black text-red-600">★ 4.9</div>
            <div className="text-xs text-gray-500 font-semibold">+2.100 avaliações</div>
          </div>

          <div className="absolute bottom-8 -right-4 lg:-right-8 glass rounded-2xl px-4 py-3 shadow-xl border border-white/30 animate-float">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-400 rounded-full flex items-center justify-center text-sm">🛵</div>
              <div>
                <div className="text-xs font-black text-gray-900">Entrega Rápida</div>
                <div className="text-xs text-gray-500">Em até 30 min</div>
              </div>
            </div>
          </div>

          <div className="absolute top-1/2 -right-2 lg:-right-6 glass rounded-2xl px-3 py-2 shadow-xl border border-white/30">
            <div className="text-center">
              <div className="text-lg">🔥</div>
              <div className="text-[10px] font-black text-gray-700">HOT</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/40 animate-bounce">
        <span className="text-xs font-semibold">Ver mais</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  );
}
