import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShoppingCart, Search, Menu, X, Plus, Minus, Trash2, Star, Clock, MapPin, Phone, Flame, Award, Home, Utensils, Heart, User, Truck, Check, Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';
const logoImg = 'https://firebasestorage.googleapis.com/v0/b/cardapiomhlanches.firebasestorage.app/o/produtos%2FMH%20Logo1.png?alt=media&token=a4d5e4c0-146e-4d20-8f1c-7f2735e06fe4';
import AdminPanel from './components/AdminPanel';
import { initFirebase } from './firebase/config';

// Types
interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  rating: number;
  time: string;
  discount?: number;
}

interface CartItem extends MenuItem {
  quantity: number;
}

// Menu Data
const menuItems: MenuItem[] = [
  { id: 1, name: 'Classic Burger', description: 'Pão brioche, carne 180g, queijo cheddar, alface, tomate, cebola e molho especial', price: 29.90, category: 'burgers', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400&h=300', rating: 4.8, time: '25 min', discount: 0 },
  { id: 2, name: 'Bacon Supreme', description: 'Pão brioche, carne 180g, queijo cheddar, bacon crispy, molho barbecue e cebola', price: 34.90, category: 'burgers', image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?auto=format&fit=crop&q=80&w=400&h=300', rating: 4.9, time: '30 min', discount: 15 },
  { id: 3, name: 'Double Smash', description: 'Dois hambúrgueres smash, queijo prato, cebola caramelizada e pickles', price: 38.90, category: 'burgers', image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&q=80&w=400&h=300', rating: 4.7, time: '25 min', discount: 0 },
  { id: 4, name: 'Cheese Jalapeño', description: 'Pão australiano, carne 200g, queijo pepper jack, jalapeños e cream cheese', price: 36.90, category: 'burgers', image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&q=80&w=400&h=300', rating: 4.6, time: '28 min', discount: 0 },
  { id: 5, name: 'Chicken Crispy', description: 'Filé de frango empanado crispy, alface, tomate e maionese herbácea', price: 31.90, category: 'burgers', image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&q=80&w=400&h=300', rating: 4.5, time: '25 min', discount: 10 },
  { id: 6, name: 'Milkshake Oreo', description: 'Milkshake cremoso com pedaços de Oreo e calda de chocolate', price: 18.90, category: 'drinks', image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&q=80&w=400&h=300', rating: 4.8, time: '10 min', discount: 0 },
  { id: 7, name: 'Milkshake Morango', description: 'Milkshake de morango fresco com chantilly e calda', price: 18.90, category: 'drinks', image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&q=80&w=400&h=300', rating: 4.7, time: '10 min', discount: 0 },
  { id: 8, name: 'Coca-Cola Lata', description: 'Lata de Coca-Cola 350ml bem gelada', price: 6.90, category: 'drinks', image: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?auto=format&fit=crop&q=80&w=400&h=300', rating: 4.5, time: '5 min', discount: 0 },
  { id: 9, name: 'Guaraná Antarctica', description: 'Lata de Guaraná Antarctica 350ml', price: 6.90, category: 'drinks', image: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?auto=format&fit=crop&q=80&w=400&h=300', rating: 4.4, time: '5 min', discount: 0 },
  { id: 10, name: 'Suco de Laranja', description: 'Suco de laranja natural 500ml', price: 12.90, category: 'drinks', image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&q=80&w=400&h=300', rating: 4.6, time: '8 min', discount: 0 },
  { id: 11, name: 'Batata Frita Grande', description: 'Batata frita crocante com queijo cheddar e bacon', price: 22.90, category: 'sides', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&q=80&w=400&h=300', rating: 4.6, time: '15 min', discount: 20 },
  { id: 12, name: 'Batata Rústica', description: 'Batata rústica com ervas finas e molho rosé', price: 19.90, category: 'sides', image: 'https://images.unsplash.com/photo-1518013431117-eb1465fa5752?auto=format&fit=crop&q=80&w=400&h=300', rating: 4.5, time: '18 min', discount: 0 },
  { id: 13, name: 'Anéis de Cebola', description: 'Anéis de cebola empanados crocantes com molho especial', price: 19.90, category: 'sides', image: 'https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&q=80&w=400&h=300', rating: 4.4, time: '15 min', discount: 0 },
  { id: 14, name: 'Nuggets (8un)', description: 'Nuggets de frango crocantes com barbecue', price: 21.90, category: 'sides', image: 'https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&q=80&w=400&h=300', rating: 4.7, time: '15 min', discount: 0 },
  { id: 15, name: 'Sundae Chocolate', description: 'Sorvete de creme com calda de chocolate e granulado', price: 14.90, category: 'desserts', image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&q=80&w=400&h=300', rating: 4.7, time: '10 min', discount: 0 },
  { id: 16, name: 'Brownie com Sorvete', description: 'Brownie de chocolate com nozes e sorvete de creme', price: 24.90, category: 'desserts', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=400&h=300', rating: 4.9, time: '12 min', discount: 0 },
];

const categories = [
  { id: 'all', name: 'Todos', icon: '🍽️' },
  { id: 'burgers', name: 'Burgers', icon: '🍔' },
  { id: 'drinks', name: 'Bebidas', icon: '🥤' },
  { id: 'sides', name: 'Acompanhamentos', icon: '🍟' },
  { id: 'desserts', name: 'Sobremesas', icon: '🍰' },
];



const App: React.FC = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);

  // Inicializa Firebase e testa conexão
  useEffect(() => {
    const firebase = initFirebase();
    if (firebase) {
      console.log('🔥 Firebase conectado com sucesso!');
      console.log('📁 Projeto: cardapiomhlanches');
      console.log('🪣 Storage: cardapiomhlanches.firebasestorage.app');
    } else {
      console.warn('⚠️ Firebase não pôde ser inicializado');
    }
  }, []);

  // Scroll horizontal da barra de categorias
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // Verifica posição do scroll para mostrar/esconder setas
  const checkScrollPosition = useCallback(() => {
    const el = categoryScrollRef.current;
    if (!el) return;
    const scrollLeft = el.scrollLeft;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setShowLeftArrow(scrollLeft > 5);
    setShowRightArrow(scrollLeft < maxScroll - 5);
  }, []);

  // Scroll com botões de seta
  const scrollCategories = useCallback((direction: 'left' | 'right') => {
    const el = categoryScrollRef.current;
    if (!el) return;
    const scrollAmount = 200;
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  }, []);

  // Atualiza setas ao montar e ao redimensionar
  useEffect(() => {
    const el = categoryScrollRef.current;
    if (!el) return;
    checkScrollPosition();
    el.addEventListener('scroll', checkScrollPosition, { passive: true });
    window.addEventListener('resize', checkScrollPosition);
    return () => {
      el.removeEventListener('scroll', checkScrollPosition);
      window.removeEventListener('resize', checkScrollPosition);
    };
  }, [checkScrollPosition]);

  // 🔍 Modo Identificador de Elementos
  const [inspectorActive, setInspectorActive] = useState(false);
  const [inspectorInfo, setInspectorInfo] = useState<{
    tag: string;
    id: string;
    classes: string;
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const highlightedEl = useRef<HTMLElement | null>(null);
  const originalStyles = useRef<Map<HTMLElement, string>>(new Map());

  const handleInspectorMouseOver = useCallback((e: MouseEvent) => {
    if (!inspectorActive) return;
    const target = e.target as HTMLElement;
    if (!target || target.closest('[data-inspector-ui]')) return;

    // Remove highlight from previous
    if (highlightedEl.current && highlightedEl.current !== target) {
      const prev = highlightedEl.current;
      const orig = originalStyles.current.get(prev);
      if (orig !== undefined) {
        prev.setAttribute('style', orig);
      } else {
        prev.removeAttribute('style');
      }
      prev.removeAttribute('data-inspector-highlight');
    }

    // Save original style
    if (!originalStyles.current.has(target)) {
      originalStyles.current.set(target, target.getAttribute('style') || '');
    }

    // Apply highlight
    target.setAttribute('data-inspector-highlight', 'true');
    target.style.outline = '2px dashed #ff6b35';
    target.style.outlineOffset = '2px';
    target.style.cursor = 'crosshair';
    highlightedEl.current = target;

    const rect = target.getBoundingClientRect();
    const tag = target.tagName.toLowerCase();
    const id = target.id || '';
    const classList = Array.from(target.classList).slice(0, 6).join('.');
    const text = (target.textContent || '').trim().substring(0, 60);

    setInspectorInfo({
      tag,
      id,
      classes: classList,
      text,
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    });
  }, [inspectorActive]);

  const handleInspectorMouseOut = useCallback((e: MouseEvent) => {
    if (!inspectorActive) return;
    const target = e.target as HTMLElement;
    if (target && target.getAttribute('data-inspector-highlight')) {
      const orig = originalStyles.current.get(target);
      if (orig !== undefined) {
        target.setAttribute('style', orig);
      } else {
        target.removeAttribute('style');
      }
      target.removeAttribute('data-inspector-highlight');
    }
  }, [inspectorActive]);

  const handleInspectorClick = useCallback((e: MouseEvent) => {
    if (!inspectorActive) return;
    e.preventDefault();
    e.stopPropagation();
  }, [inspectorActive]);

  useEffect(() => {
    if (inspectorActive) {
      document.addEventListener('mouseover', handleInspectorMouseOver);
      document.addEventListener('mouseout', handleInspectorMouseOut);
      document.addEventListener('click', handleInspectorClick, true);
    } else {
      document.removeEventListener('mouseover', handleInspectorMouseOver);
      document.removeEventListener('mouseout', handleInspectorMouseOut);
      document.removeEventListener('click', handleInspectorClick, true);
      // Clean up all highlights
      document.querySelectorAll('[data-inspector-highlight]').forEach(el => {
        const htmlEl = el as HTMLElement;
        const orig = originalStyles.current.get(htmlEl);
        if (orig !== undefined) {
          htmlEl.setAttribute('style', orig);
        } else {
          htmlEl.removeAttribute('style');
        }
        htmlEl.removeAttribute('data-inspector-highlight');
      });
      originalStyles.current.clear();
      highlightedEl.current = null;
      setInspectorInfo(null);
    }
    return () => {
      document.removeEventListener('mouseover', handleInspectorMouseOver);
      document.removeEventListener('mouseout', handleInspectorMouseOut);
      document.removeEventListener('click', handleInspectorClick, true);
    };
  }, [inspectorActive, handleInspectorMouseOver, handleInspectorMouseOut, handleInspectorClick]);

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setToastMessage(`${item.name} adicionado!`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const deliveryFee = cartTotal > 50 ? 0 : 5.99;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white relative pb-20 md:pb-0">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-500/15 to-pink-500/15 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-20 right-4 z-[60] animate-slide-in">
          <div className="bg-gradient-to-r from-green-500/90 to-emerald-500/90 backdrop-blur-xl px-6 py-3 rounded-2xl shadow-2xl shadow-green-500/30 border border-green-400/30 flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Navbar - Fixa no topo */}
      <nav className="fixed top-0 left-0 right-0 w-full z-[55] bg-black/80 backdrop-blur-2xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img
                src={logoImg}
                alt="MH Lanches"
                className="w-10 h-10 object-contain rounded-lg"
              />
              <span className="text-2xl bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent">
                <span style={{ fontFamily: "'Poppins', sans-serif" }} className="font-extrabold tracking-wide">MH</span>{" "}
                <span style={{ fontFamily: "'Lobster', cursive" }}>Lanches</span>
              </span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#inicio" className="text-white/80 hover:text-orange-400 transition-colors font-medium">Início</a>
              <a href="#menu" className="text-white/80 hover:text-orange-400 transition-colors font-medium">Cardápio</a>
              <a href="#promocoes" className="text-white/80 hover:text-orange-400 transition-colors font-medium">Promoções</a>
              <a href="#contato" className="text-white/80 hover:text-orange-400 transition-colors font-medium">Contato</a>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAdmin(true)}
                title="Painel Admin"
                className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-orange-500/30 p-3 rounded-xl transition-all duration-300"
              >
                <span className="text-lg group-hover:scale-110 transition-transform block">⚙️</span>
              </button>
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative group bg-gradient-to-r from-orange-500/20 to-red-500/20 hover:from-orange-500/30 hover:to-red-500/30 border border-orange-500/30 p-3 rounded-xl transition-all duration-300"
              >
                <ShoppingCart className="w-5 h-5 text-orange-400 group-hover:scale-110 transition-transform" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-orange-500 to-red-500 rounded-full text-xs font-bold flex items-center justify-center shadow-lg shadow-orange-500/50">
                    {cartCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden bg-white/5 hover:bg-white/10 p-3 rounded-xl border border-white/10 transition-all"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-black/80 backdrop-blur-2xl border-t border-white/10">
            <div className="px-4 py-4 space-y-2">
              {[
                { label: 'Início', href: '#inicio' },
                { label: 'Cardápio', href: '#menu' },
                { label: 'Promoções', href: '#promocoes' },
                { label: 'Contato', href: '#contato' },
              ].map(item => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </nav>

        {/* Hero Section - Logo Centralizada */}
       <section id="inicio" className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 relative flex items-center justify-center min-h-[60vh]">
         <div className="flex flex-col items-center justify-center">
           {/* Logo Animada Centralizada */}
           <div className="relative animate-float">
             {/* Glow Effect */}
             <div className="absolute -inset-8 bg-gradient-to-r from-orange-500/40 via-red-500/40 to-pink-500/40 rounded-full blur-3xl animate-pulse" />
             
             {/* Logo Image */}
              <div className="relative">
<img
                   src={logoImg}
                    alt="MH Lanches Logo"
                   className="w-64 h-64 sm:w-72 sm:h-72 lg:w-80 lg:h-80 object-contain drop-shadow-2xl filter brightness-110"
                 />
               </div>
            </div>

            {/* Slogan */}
            <div className="mt-8 text-center">
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent animate-pulse">
                Mais que uma lanchonete !
              </p>
              <div className="mt-3 mx-auto w-24 h-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full opacity-60" />
            </div>
          </div>
        </section>

       {/* Promo Banner */}
      {/* Promoções Section */}
      <section id="promocoes" className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-black mb-2">
              <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">Promoções</span>
            </h2>
            <p className="text-white/60">Aproveite nossas ofertas especiais!</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '🎁', title: 'Primeiro Pedido', desc: 'Ganhe 15% OFF', color: 'from-orange-500/20 to-red-500/20', border: 'border-orange-500/30' },
              { icon: '🚚', title: 'Frete Grátis', desc: 'Acima de R$50', color: 'from-cyan-500/20 to-blue-500/20', border: 'border-cyan-500/30' },
              { icon: '⭐', title: 'Cliente VIP', desc: 'Descontos exclusivos', color: 'from-purple-500/20 to-pink-500/20', border: 'border-purple-500/30' },
            ].map((promo, index) => (
              <div
                key={index}
                className={`relative bg-gradient-to-r ${promo.color} backdrop-blur-2xl rounded-2xl p-6 border ${promo.border} hover:scale-[1.02] transition-all duration-300 group cursor-pointer`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                    {promo.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{promo.title}</h3>
                    <p className="text-white/60">{promo.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Menu Section */}
      <section id="menu" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-black mb-4">
              Nosso <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">Cardápio</span>
            </h2>
            <p className="text-white/60 max-w-xl mx-auto">Escolha entre nossos deliciosos hambúrgueres, acompanhamentos, bebidas e sobremesas</p>
          </div>

          {/* Search Bar */}
          <div className="max-w-md mx-auto mb-8">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-orange-400 transition-colors" />
              <input
                type="text"
                placeholder="Buscar item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 focus:border-orange-500/50 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-white/40 outline-none transition-all backdrop-blur-xl focus:bg-white/10"
              />
            </div>
          </div>
        </div>

        {/* Categories - Sticky: rola normal e gruda abaixo da navbar */}
        <div id="category-bar" className="sticky top-16 z-50 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-white/5">
          <div className="relative">
            {/* Seta Esquerda - Botão clicável */}
            {showLeftArrow && (
              <button
                onClick={() => scrollCategories('left')}
                className="absolute left-0 top-0 bottom-0 z-20 flex items-center justify-center w-7 bg-gradient-to-r from-[#0a0a0f] via-[#0a0a0f]/90 to-transparent cursor-pointer hover:from-orange-500/20 transition-all duration-300 group"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-orange-400 group-hover:text-orange-300 group-hover:scale-125 transition-all" />
              </button>
            )}
            
            {/* Seta Direita - Botão clicável */}
            {showRightArrow && (
              <button
                onClick={() => scrollCategories('right')}
                className="absolute right-0 top-0 bottom-0 z-20 flex items-center justify-center w-7 bg-gradient-to-l from-[#0a0a0f] via-[#0a0a0f]/90 to-transparent cursor-pointer hover:from-orange-500/20 transition-all duration-300 group"
              >
                <ChevronRight className="w-3.5 h-3.5 text-orange-400 group-hover:text-orange-300 group-hover:scale-125 transition-all" />
              </button>
            )}
            
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-1.5">
              <div
                ref={categoryScrollRef}
                className="flex gap-1.5 overflow-x-auto scrollbar-hide touch-scroll snap-x snap-mandatory"
                style={{ scrollPadding: '0 12px' }}
              >
                {/* Espaçador inicial */}
                <div className="flex-shrink-0 w-0.5" />
                
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setActiveCategory(category.id)}
                    className={`snap-start flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all duration-300 text-xs ${
                      activeCategory === category.id
                        ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md shadow-orange-500/25 scale-[1.02] ring-1 ring-orange-400/40'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <span className="text-sm">{category.icon}</span>
                    <span>{category.name}</span>
                  </button>
                ))}
                
                {/* Espaçador final */}
                <div className="flex-shrink-0 w-0.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Menu Grid — Cards Horizontais */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-8">
            {filteredItems.map(item => (
              <div
                key={item.id}
                className="group flex bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-2xl overflow-hidden border border-white/10 hover:border-orange-500/30 transition-all duration-500 hover:shadow-2xl hover:shadow-orange-500/10"
              >
                {/* Lado Esquerdo — Info */}
                <div className="flex-1 flex flex-col justify-between p-4 sm:p-5">
                  <div>
                    {/* Badges */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {item.discount && (
                        <span className="bg-gradient-to-r from-red-500 to-pink-500 px-2 py-0.5 rounded-full text-xs font-bold shadow-lg">
                          -{item.discount}%
                        </span>
                      )}
                      <span className="bg-black/40 backdrop-blur-xl px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-xs font-semibold">{item.rating}</span>
                      </span>
                      <span className="flex items-center gap-1 text-xs text-white/40">
                        <Clock className="w-3 h-3" />
                        {item.time}
                      </span>
                    </div>

                    {/* Nome */}
                    <h3 className="text-lg font-bold mb-1 leading-tight">{item.name}</h3>

                    {/* Descrição */}
                    <p className="text-xs sm:text-sm text-white/50 line-clamp-2 leading-relaxed">{item.description}</p>
                  </div>

                  {/* Preço + Botão */}
                  <div className="flex items-center justify-between mt-3">
                    <div>
                      <span className="text-[10px] text-white/40 uppercase tracking-wider">A partir de</span>
                      <p className="text-xl sm:text-2xl font-black bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent leading-tight">
                        R${item.price.toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => addToCart(item)}
                      className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl px-4 py-2.5 shadow-lg shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all duration-300"
                    >
                      <Plus className="w-5 h-5" />
                      <span className="text-sm font-bold hidden sm:inline">Adicionar</span>
                    </button>
                  </div>
                </div>

                {/* Lado Direito — Imagem */}
                <div className="relative w-36 sm:w-44 md:w-48 flex-shrink-0 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f]/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm px-2 py-0.5">
                    <p className="text-[8px] sm:text-[9px] text-white/40 text-center leading-tight">Imagem meramente ilustrativa.</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-2xl rounded-3xl p-8 sm:p-12 border border-white/10">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: <Truck className="w-8 h-8" />, title: 'Entrega Express', desc: 'Seu pedido chega em até 30 minutos na sua porta' },
                { icon: <Flame className="w-8 h-8" />, title: 'Sempre Quente', desc: 'Embalagem térmica premium para manter a temperatura' },
                { icon: <Award className="w-8 h-8" />, title: 'Qualidade Premium', desc: 'Ingredientes selecionados e 100% naturais' },
              ].map((feature, index) => (
                <div key={index} className="text-center group">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl flex items-center justify-center text-orange-400 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-orange-500/20 transition-all duration-300 border border-orange-500/20">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-white/60">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer / Contato */}
      <footer id="contato" className="py-12 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={logoImg}
                  alt="MH Lanches"
                  className="w-10 h-10 object-contain rounded-lg"
                />
                <span className="text-2xl bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                  <span style={{ fontFamily: "'Poppins', sans-serif" }} className="font-extrabold tracking-wide">MH</span>{" "}
                  <span style={{ fontFamily: "'Lobster', cursive" }}>Lanches</span>
                </span>
              </div>
              <p className="text-white/50 text-sm">O melhor hambúrguer delivery da cidade. Sabor, qualidade e velocidade na sua porta.</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Links</h4>
              <ul className="space-y-2 text-white/50">
                <li><a href="#inicio" className="hover:text-orange-400 transition-colors">Início</a></li>
                <li><a href="#menu" className="hover:text-orange-400 transition-colors">Cardápio</a></li>
                <li><a href="#promocoes" className="hover:text-orange-400 transition-colors">Promoções</a></li>
                <li><a href="#contato" className="hover:text-orange-400 transition-colors">Contato</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Contato</h4>
              <ul className="space-y-2 text-white/50 text-sm">
                <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> (11) 99999-9999</li>
                <li className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Av. Paulista, 1000</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Horário</h4>
              <ul className="space-y-2 text-white/50 text-sm">
                <li>Seg - Sex: 18h às 00h</li>
                <li>Sáb - Dom: 12h às 00h</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 text-center text-white/40 text-sm">
            <p>© 2024 MH Lanches. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      {/* Bottom Nav (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-black/80 backdrop-blur-2xl border-t border-white/10">
        <div className="flex items-center justify-around py-3">
          {[
            { icon: <Home className="w-6 h-6" />, label: 'Início', active: true },
            { icon: <Utensils className="w-6 h-6" />, label: 'Menu', active: false },
            { icon: <Heart className="w-6 h-6" />, label: 'Favoritos', active: false },
            { icon: <User className="w-6 h-6" />, label: 'Perfil', active: false },
          ].map((item, index) => (
            <button
              key={index}
              className={`flex flex-col items-center gap-1 ${item.active ? 'text-orange-400' : 'text-white/50'}`}
            >
              {item.icon}
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-full sm:w-96 bg-gradient-to-b from-[#0a0a0f] to-[#12121a] backdrop-blur-2xl border-l border-white/10 flex flex-col animate-slide-in">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ShoppingCart className="w-6 h-6 text-orange-400" />
                  Meu Carrinho
                </h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-10 h-10 text-white/30" />
                  </div>
                  <p className="text-white/50">Seu carrinho está vazio</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="bg-white/5 rounded-2xl p-4 border border-white/10">
                      <div className="flex gap-4">
                        <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-xl" />
                        <div className="flex-1">
                          <h4 className="font-semibold">{item.name}</h4>
                          <p className="text-orange-400 font-bold">R${(item.price * item.quantity).toFixed(2)}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-all"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="font-bold w-6 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-all"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="ml-auto p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t border-white/10 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-white/60">
                    <span>Subtotal</span>
                    <span>R${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>Entrega</span>
                    <span className={deliveryFee === 0 ? 'text-green-400' : ''}>
                      {deliveryFee === 0 ? 'Grátis 🎉' : `R$${deliveryFee.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="h-px bg-white/10" />
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                      R${(cartTotal + deliveryFee).toFixed(2)}
                    </span>
                  </div>
                </div>

                <button className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl font-bold text-lg shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                  Finalizar Pedido
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🔍 MODO IDENTIFICADOR DE ELEMENTOS - Toggle Button */}
      <button
        data-inspector-ui="true"
        onClick={() => setInspectorActive(!inspectorActive)}
        className={`fixed bottom-20 md:bottom-6 right-4 z-[70] p-4 rounded-2xl shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 ${
          inspectorActive
            ? 'bg-gradient-to-r from-orange-500 to-red-600 shadow-orange-500/40'
            : 'bg-white/10 backdrop-blur-xl border border-white/20 shadow-black/30'
        }`}
        title={inspectorActive ? 'Desativar Identificador' : 'Ativar Identificador de Elementos'}
      >
        {inspectorActive ? (
          <EyeOff className="w-5 h-5 text-white" />
        ) : (
          <Eye className="w-5 h-5 text-white/70" />
        )}
      </button>

      {/* 🔍 Inspector Tooltip */}
      {inspectorActive && inspectorInfo && (
        <div
          data-inspector-ui="true"
          className="fixed z-[80] pointer-events-none"
          style={{
            left: Math.min(inspectorInfo.x, window.innerWidth - 340),
            top: inspectorInfo.y > 120 ? inspectorInfo.y - 10 : inspectorInfo.y + inspectorInfo.height + 10,
            transform: inspectorInfo.y > 120 ? 'translateY(-100%)' : 'none',
          }}
        >
          <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-2xl rounded-xl border border-orange-500/40 shadow-2xl shadow-orange-500/20 p-3 min-w-[280px] max-w-[340px]">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">Identificador de Elemento</span>
            </div>
            
            {/* Tag */}
            <div className="mb-2">
              <span className="text-[10px] text-white/40 uppercase tracking-wider">Tag</span>
              <div className="flex items-center gap-2 mt-0.5">
                <code className="text-sm font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                  &lt;{inspectorInfo.tag}&gt;
                </code>
              </div>
            </div>

            {/* ID */}
            {inspectorInfo.id && (
              <div className="mb-2">
                <span className="text-[10px] text-white/40 uppercase tracking-wider">ID</span>
                <div className="mt-0.5">
                  <code className="text-sm font-mono font-bold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded">
                    #{inspectorInfo.id}
                  </code>
                </div>
              </div>
            )}

            {/* Classes */}
            {inspectorInfo.classes && (
              <div className="mb-2">
                <span className="text-[10px] text-white/40 uppercase tracking-wider">Classes</span>
                <div className="mt-0.5 flex flex-wrap gap-1">
                  {inspectorInfo.classes.split('.').filter(Boolean).map((cls, i) => (
                    <code key={i} className="text-xs font-mono text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                      .{cls}
                    </code>
                  ))}
                </div>
              </div>
            )}

            {/* Text Content */}
            {inspectorInfo.text && (
              <div>
                <span className="text-[10px] text-white/40 uppercase tracking-wider">Texto</span>
                <p className="mt-0.5 text-xs text-white/70 italic truncate">
                  "{inspectorInfo.text}"
                </p>
              </div>
            )}

            {/* Dimensions */}
            <div className="mt-2 pt-2 border-t border-white/10 flex gap-3">
              <span className="text-[10px] text-white/30">
                {Math.round(inspectorInfo.width)}×{Math.round(inspectorInfo.height)}px
              </span>
              <span className="text-[10px] text-white/30">
                Pos: {Math.round(inspectorInfo.x)}, {Math.round(inspectorInfo.y)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 🔍 Inspector Active Indicator */}
      {inspectorActive && (
        <div
          data-inspector-ui="true"
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[70] bg-gradient-to-r from-orange-500/90 to-red-500/90 backdrop-blur-xl px-5 py-2 rounded-full shadow-2xl shadow-orange-500/30 border border-orange-400/30"
        >
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-white" />
            <span className="text-sm font-bold text-white">🔍 Modo Identificador ATIVO</span>
            <span className="text-xs text-white/70">— Passe o mouse nos elementos</span>
          </div>
        </div>
      )}

      {/* Custom Styles */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        body {
          background: #0a0a0f;
        }
      `}</style>

      {/* Painel Admin */}
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </div>
  );
};

export default App;