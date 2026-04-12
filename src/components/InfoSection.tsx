export default function InfoSection() {
  const features = [
    {
      icon: "🛵",
      title: "Entrega Rápida",
      desc: "Em até 30 minutos na sua porta, ou você não paga a entrega!",
      color: "from-red-500 to-rose-400",
      bg: "bg-red-50",
    },
    {
      icon: "👨‍🍳",
      title: "Feito na Hora",
      desc: "Nossos lanches são preparados na hora com ingredientes frescos e de qualidade.",
      color: "from-orange-500 to-yellow-400",
      bg: "bg-orange-50",
    },
    {
      icon: "🔒",
      title: "Pagamento Seguro",
      desc: "Aceitamos Pix, cartões de crédito e débito, e também dinheiro na entrega.",
      color: "from-green-500 to-emerald-400",
      bg: "bg-green-50",
    },
    {
      icon: "⭐",
      title: "Qualidade Garantida",
      desc: "Mais de 2.000 avaliações positivas. Sua satisfação é nossa prioridade!",
      color: "from-blue-500 to-cyan-400",
      bg: "bg-blue-50",
    },
  ];

  return (
    <section id="sobre" className="py-16 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block bg-red-100 text-red-600 text-sm font-bold px-4 py-2 rounded-full mb-4">
            Por que nos escolher?
          </span>
          <h2 className="text-4xl font-black text-gray-900">
            O delivery que você
            <br />
            <span className="gradient-text">merece! 🚀</span>
          </h2>
          <p className="text-gray-500 mt-4 max-w-lg mx-auto text-base font-medium">
            Combinamos sabor, velocidade e qualidade para oferecer a melhor experiência de delivery de lanches da cidade.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f) => (
            <div key={f.title} className="card-hover bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-center">
              <div className={`w-14 h-14 mx-auto rounded-2xl ${f.bg} flex items-center justify-center text-2xl mb-4`}>
                {f.icon}
              </div>
              <h3 className="font-black text-gray-900 text-base mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Stats bar */}
        <div className="mt-12 bg-gradient-to-r from-red-600 to-rose-500 rounded-3xl p-8 text-white">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {[
              { value: "2.100+", label: "Clientes Felizes" },
              { value: "4.9★", label: "Avaliação Média" },
              { value: "30 min", label: "Tempo Médio" },
              { value: "100%", label: "Ingredientes Frescos" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-black">{stat.value}</div>
                <div className="text-white/70 text-sm font-semibold mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
