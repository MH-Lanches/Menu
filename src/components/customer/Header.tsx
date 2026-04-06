import { useState, useEffect } from 'react';
import { Clock, MapPin, Search, X } from 'lucide-react';
import { useStoreContext } from '../../context/StoreContext';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function Header({ searchQuery, setSearchQuery }: HeaderProps) {
  const { storeData, isStoreOpen } = useStoreContext();
  const [open, setOpen] = useState(isStoreOpen());
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setOpen(isStoreOpen());
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [isStoreOpen]);

  const getCurrentSchedule = () => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()];
    const hours = storeData.settings.businessHours[today];
    
    if (!hours?.enabled) return 'Fechado hoje';
    return `${hours.open} - ${hours.close}`;
  };

  return (
    <header className="relative">
      {/* Banner */}
      <div 
        className="h-40 md:h-56 bg-cover bg-center relative"
        style={{ 
          backgroundImage: storeData.settings.bannerImage 
            ? `url(${storeData.settings.bannerImage})` 
            : `linear-gradient(135deg, ${storeData.settings.primaryColor}, ${storeData.settings.secondaryColor})`
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        
        {/* Store Status Badge */}
        <div className="absolute top-4 right-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-sm font-medium ${open ? 'badge-open' : 'badge-closed'}`}>
            <span className={`w-2 h-2 rounded-full bg-white ${open ? 'animate-pulse' : ''}`} />
            {open ? 'Aberto' : 'Fechado'}
          </div>
        </div>

        {/* Search Button Mobile */}
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="absolute top-4 left-4 md:hidden p-2 bg-white/20 backdrop-blur-sm rounded-full text-white"
        >
          <Search size={20} />
        </button>
      </div>

      {/* Store Info */}
      <div className="relative -mt-16 px-4">
        <div className="glass rounded-2xl p-4 shadow-lg max-w-3xl mx-auto">
          <div className="flex items-start gap-4">
            {/* Logo */}
            <div 
              className="w-20 h-20 md:w-24 md:h-24 rounded-xl flex items-center justify-center text-3xl md:text-4xl shadow-md flex-shrink-0"
              style={{ backgroundColor: storeData.settings.primaryColor }}
            >
              {storeData.settings.logo ? (
                <img src={storeData.settings.logo} alt="Logo" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <span>🍔</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate">
                {storeData.settings.storeName}
              </h1>
              
              <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                <MapPin size={14} className="flex-shrink-0" />
                <span className="truncate">{storeData.settings.address}</span>
              </div>

              <div className="flex items-center gap-1 text-sm mt-1" style={{ color: open ? '#22c55e' : '#ef4444' }}>
                <Clock size={14} className="flex-shrink-0" />
                <span>{getCurrentSchedule()}</span>
              </div>

              {/* Delivery Info */}
              <div className="flex items-center gap-3 mt-2 text-sm">
                <span className="px-2 py-1 bg-gray-100 rounded-lg text-gray-700">
                  🛵 R$ {storeData.settings.deliveryFee.toFixed(2)}
                </span>
                <span className="text-gray-500">
                  Pedido mín: R$ {storeData.settings.minOrder.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Search Bar Desktop */}
          <div className="hidden md:block mt-4">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar no cardápio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/50 z-50 md:hidden animate-fade-in" onClick={() => setShowSearch(false)}>
          <div className="bg-white p-4" onClick={e => e.stopPropagation()}>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar no cardápio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              />
              <button
                onClick={() => setShowSearch(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
