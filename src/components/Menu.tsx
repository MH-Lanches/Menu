import { useState } from "react";
import { categories, menuItems, MenuItem } from "../data/menu";
import MenuCard from "./MenuCard";

interface MenuProps {
  onAdd: (item: MenuItem) => void;
}

export default function Menu({ onAdd }: MenuProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = menuItems.filter((item) => {
    const matchCat = activeCategory === "all" || item.category === activeCategory;
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const popular = menuItems.filter((item) => item.popular);

  return (
    <section id="cardapio" className="py-12 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-black text-gray-900">🍽️ Nosso Cardápio</h2>
            <p className="text-gray-500 text-sm font-medium mt-1">
              {filtered.length} {filtered.length === 1 ? "item encontrado" : "itens encontrados"}
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar no cardápio..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-gray-100 bg-gray-50 focus:bg-white focus:border-red-400 outline-none text-sm font-semibold text-gray-700 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2.5 overflow-x-auto pb-3 mb-8 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm border-2 transition-all duration-200 whitespace-nowrap ${
                activeCategory === cat.id
                  ? "bg-red-600 text-white border-red-600 shadow-lg shadow-red-200"
                  : "bg-white text-gray-600 border-gray-200 hover:border-red-300 hover:text-red-600"
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Popular Section (shown only when on "all" category and no search) */}
        {activeCategory === "all" && !search && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🔥</span>
              <h3 className="font-black text-xl text-gray-900">Mais Pedidos</h3>
              <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                TOP
              </span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {popular.map((item) => (
                <div key={item.id} className="flex-shrink-0 w-64">
                  <MenuCard item={item} onAdd={onAdd} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Divider */}
        {activeCategory === "all" && !search && (
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-gray-100"></div>
            <span className="text-gray-400 text-sm font-bold">TODOS OS ITENS</span>
            <div className="flex-1 h-px bg-gray-100"></div>
          </div>
        )}

        {/* Menu Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((item) => (
              <MenuCard key={item.id} item={item} onAdd={onAdd} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-black text-gray-700">Nenhum item encontrado</h3>
            <p className="text-gray-400 text-sm mt-2">Tente buscar por outro nome ou categoria</p>
            <button
              onClick={() => { setSearch(""); setActiveCategory("all"); }}
              className="mt-4 text-red-600 font-bold text-sm hover:underline"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
