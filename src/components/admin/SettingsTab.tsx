import { useState } from 'react';
import { Check, Phone, MapPin, DollarSign, Truck, FileText } from 'lucide-react';
import { useStoreContext } from '../../context/StoreContext';

export function SettingsTab() {
  const { storeData, updateSettings } = useStoreContext();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Configurações</h1>

      {/* Store Info */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText size={20} className="text-gray-500" />
          Informações da Loja
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Loja</label>
            <input
              type="text"
              value={storeData.settings.storeName}
              onChange={(e) => updateSettings({ storeName: e.target.value })}
              placeholder="Ex: Delivery Express"
              className="w-full p-3 border border-gray-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <MapPin size={14} />
              Endereço
            </label>
            <input
              type="text"
              value={storeData.settings.address}
              onChange={(e) => updateSettings({ address: e.target.value })}
              placeholder="Rua, número, bairro..."
              className="w-full p-3 border border-gray-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Texto do Rodapé</label>
            <input
              type="text"
              value={storeData.settings.footerText}
              onChange={(e) => updateSettings({ footerText: e.target.value })}
              placeholder="© 2024 Sua Loja - Todos os direitos reservados"
              className="w-full p-3 border border-gray-200 rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* WhatsApp */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Phone size={20} className="text-green-500" />
          WhatsApp
        </h2>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Número do WhatsApp</label>
          <input
            type="text"
            value={storeData.settings.whatsappNumber}
            onChange={(e) => updateSettings({ whatsappNumber: e.target.value })}
            placeholder="5511999999999"
            className="w-full p-3 border border-gray-200 rounded-xl"
          />
          <p className="text-xs text-gray-500 mt-1">
            Formato: código do país + DDD + número (sem espaços ou traços)
          </p>
        </div>

        {/* Preview */}
        {storeData.settings.whatsappNumber && (
          <div className="mt-3 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              📱 Os pedidos serão enviados para: <strong>+{storeData.settings.whatsappNumber}</strong>
            </p>
          </div>
        )}
      </div>

      {/* Delivery */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Truck size={20} className="text-blue-500" />
          Entrega
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <DollarSign size={14} />
              Taxa de Entrega
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={storeData.settings.deliveryFee}
                onChange={(e) => updateSettings({ deliveryFee: parseFloat(e.target.value) || 0 })}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pedido Mínimo</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={storeData.settings.minOrder}
                onChange={(e) => updateSettings({ minOrder: parseFloat(e.target.value) || 0 })}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl"
              />
            </div>
          </div>
        </div>

        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            🛵 Taxa: <strong>R$ {storeData.settings.deliveryFee.toFixed(2)}</strong> | 
            Pedido mínimo: <strong>R$ {storeData.settings.minOrder.toFixed(2)}</strong>
          </p>
        </div>
      </div>

      {/* Export/Import Data */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">🗂️ Dados</h2>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              const data = JSON.stringify(storeData, null, 2);
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'produtos.json';
              a.click();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600"
          >
            📥 Exportar Dados
          </button>
          
          <label className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 cursor-pointer">
            📤 Importar Dados
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    try {
                      const data = JSON.parse(event.target?.result as string);
                      if (data.products && data.categories && data.settings) {
                        localStorage.setItem('delivery_store_data', JSON.stringify(data));
                        window.location.reload();
                      } else {
                        alert('Arquivo inválido');
                      }
                    } catch {
                      alert('Erro ao ler arquivo');
                    }
                  };
                  reader.readAsText(file);
                }
              }}
            />
          </label>
          
          <button
            onClick={() => {
              if (confirm('Tem certeza que deseja resetar TODOS os dados? Esta ação não pode ser desfeita.')) {
                localStorage.removeItem('delivery_store_data');
                localStorage.removeItem('delivery_cart');
                localStorage.removeItem('delivery_favorites');
                window.location.reload();
              }
            }}
            className="px-4 py-2 bg-red-100 text-red-600 rounded-xl font-medium hover:bg-red-200"
          >
            🗑️ Resetar Tudo
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-6 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 flex items-center gap-2"
        >
          {saved ? <Check size={18} /> : null}
          <span>{saved ? 'Configurações Salvas!' : 'Salvar Configurações'}</span>
        </button>
      </div>
    </div>
  );
}
