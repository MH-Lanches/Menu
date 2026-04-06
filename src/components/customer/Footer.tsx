import { useStoreContext } from '../../context/StoreContext';

export function Footer() {
  const { storeData } = useStoreContext();

  return (
    <footer className="bg-gray-900 text-gray-400 py-6 px-4 mt-8">
      <div className="max-w-3xl mx-auto text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-2xl">🍔</span>
          <span className="text-white font-semibold">{storeData.settings.storeName}</span>
        </div>
        
        <p className="text-sm">{storeData.settings.footerText}</p>
        
        <div className="mt-4 pt-4 border-t border-gray-800 text-xs">
          <p>Desenvolvido com ❤️</p>
        </div>
      </div>
    </footer>
  );
}
