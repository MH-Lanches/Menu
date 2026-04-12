import { useState } from "react";

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
}

export default function Navbar({ cartCount, onCartClick }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass shadow-sm border-b border-red-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-red-600 to-red-400 rounded-xl flex items-center justify-center shadow-md shadow-red-200 animate-badge">
            <span className="text-lg">🍔</span>
          </div>
          <div>
            <span className="font-black text-xl text-gray-900 tracking-tight leading-none">
              Burguer<span className="text-red-600">Zap</span>
            </span>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full inline-block animate-pulse"></span>
              <span className="text-[10px] text-green-600 font-bold">ABERTO AGORA</span>
            </div>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <a href="#inicio" className="text-gray-600 hover:text-red-600 font-600 transition-colors text-sm font-semibold">
            Início
          </a>
          <a href="#cardapio" className="text-gray-600 hover:text-red-600 transition-colors text-sm font-semibold">
            Cardápio
          </a>
          <a href="#promocoes" className="text-gray-600 hover:text-red-600 transition-colors text-sm font-semibold">
            Promoções
          </a>
          <a href="#sobre" className="text-gray-600 hover:text-red-600 transition-colors text-sm font-semibold">
            Sobre
          </a>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Location */}
          <button className="hidden md:flex items-center gap-1 text-gray-500 hover:text-red-600 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs font-semibold">Rua das Flores, 123</span>
          </button>

          {/* Cart */}
          <button
            onClick={onCartClick}
            className="relative w-10 h-10 bg-red-600 hover:bg-red-700 rounded-xl flex items-center justify-center transition-all shadow-md shadow-red-200 btn-shine"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-yellow-400 text-gray-900 text-[10px] font-black rounded-full flex items-center justify-center animate-badge shadow">
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-xl hover:bg-red-50 transition-colors"
          >
            <span className={`block w-5 h-0.5 bg-gray-700 transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`}></span>
            <span className={`block w-5 h-0.5 bg-gray-700 transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`}></span>
            <span className={`block w-5 h-0.5 bg-gray-700 transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`}></span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ${menuOpen ? "max-h-72" : "max-h-0"}`}>
        <div className="px-4 pb-4 pt-2 flex flex-col gap-1 border-t border-gray-100 bg-white">
          {["Início#inicio", "Cardápio#cardapio", "Promoções#promocoes", "Sobre#sobre"].map((item) => {
            const [label, href] = item.split("#");
            return (
              <a
                key={href}
                href={`#${href}`}
                onClick={() => setMenuOpen(false)}
                className="py-3 px-4 rounded-xl text-gray-700 font-semibold hover:bg-red-50 hover:text-red-600 transition-colors text-sm"
              >
                {label}
              </a>
            );
          })}
          <div className="flex items-center gap-2 py-3 px-4 text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <span className="text-sm font-semibold">Rua das Flores, 123</span>
          </div>
        </div>
      </div>
    </header>
  );
}
