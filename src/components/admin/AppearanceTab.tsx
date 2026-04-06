import { useState } from 'react';
import { Check, RefreshCw } from 'lucide-react';
import { useStoreContext } from '../../context/StoreContext';

const COLOR_PRESETS = [
  { name: 'Vermelho', primary: '#ef4444', secondary: '#f97316', accent: '#22c55e' },
  { name: 'Azul', primary: '#3b82f6', secondary: '#6366f1', accent: '#22c55e' },
  { name: 'Verde', primary: '#22c55e', secondary: '#10b981', accent: '#f59e0b' },
  { name: 'Roxo', primary: '#8b5cf6', secondary: '#a855f7', accent: '#ec4899' },
  { name: 'Laranja', primary: '#f97316', secondary: '#fb923c', accent: '#22c55e' },
  { name: 'Rosa', primary: '#ec4899', secondary: '#f472b6', accent: '#8b5cf6' },
];

export function AppearanceTab() {
  const { storeData, updateSettings } = useStoreContext();
  const [saved, setSaved] = useState(false);

  const handleColorChange = (field: 'primaryColor' | 'secondaryColor' | 'accentColor', value: string) => {
    updateSettings({ [field]: value });
  };

  const applyPreset = (preset: typeof COLOR_PRESETS[0]) => {
    updateSettings({
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      accentColor: preset.accent,
    });
    
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Aparência</h1>

      {/* Color Presets */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <h2 className="font-semibold text-gray-900 mb-3">Paletas Prontas</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {COLOR_PRESETS.map(preset => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className="p-3 rounded-xl border border-gray-200 hover:border-gray-300 transition-all hover:shadow-md"
            >
              <div className="flex gap-1 mb-2">
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: preset.primary }} />
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: preset.secondary }} />
                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: preset.accent }} />
              </div>
              <span className="text-sm font-medium text-gray-700">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Colors */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Cores Personalizadas</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cor Primária</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={storeData.settings.primaryColor}
                onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                className="w-12 h-12 rounded-lg cursor-pointer border-0"
              />
              <input
                type="text"
                value={storeData.settings.primaryColor}
                onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                className="flex-1 p-2 border border-gray-200 rounded-lg text-sm font-mono"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Botões, links e destaques</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cor Secundária</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={storeData.settings.secondaryColor}
                onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                className="w-12 h-12 rounded-lg cursor-pointer border-0"
              />
              <input
                type="text"
                value={storeData.settings.secondaryColor}
                onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                className="flex-1 p-2 border border-gray-200 rounded-lg text-sm font-mono"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Gradientes e elementos secundários</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cor de Destaque</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={storeData.settings.accentColor}
                onChange={(e) => handleColorChange('accentColor', e.target.value)}
                className="w-12 h-12 rounded-lg cursor-pointer border-0"
              />
              <input
                type="text"
                value={storeData.settings.accentColor}
                onChange={(e) => handleColorChange('accentColor', e.target.value)}
                className="flex-1 p-2 border border-gray-200 rounded-lg text-sm font-mono"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Status "Aberto" e confirmações</p>
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Imagens</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Logo (URL)</label>
            <input
              type="url"
              value={storeData.settings.logo}
              onChange={(e) => updateSettings({ logo: e.target.value })}
              placeholder="https://..."
              className="w-full p-3 border border-gray-200 rounded-xl"
            />
            {storeData.settings.logo && (
              <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                <img 
                  src={storeData.settings.logo} 
                  alt="Logo preview" 
                  className="h-16 object-contain mx-auto"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Banner (URL)</label>
            <input
              type="url"
              value={storeData.settings.bannerImage}
              onChange={(e) => updateSettings({ bannerImage: e.target.value })}
              placeholder="https://..."
              className="w-full p-3 border border-gray-200 rounded-xl"
            />
            {storeData.settings.bannerImage && (
              <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                <img 
                  src={storeData.settings.bannerImage} 
                  alt="Banner preview" 
                  className="h-20 w-full object-cover rounded"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Preview</h2>
        
        <div className="p-4 bg-gray-100 rounded-xl">
          <div className="flex flex-wrap gap-3 mb-4">
            <button 
              className="px-4 py-2 rounded-lg text-white font-medium"
              style={{ backgroundColor: storeData.settings.primaryColor }}
            >
              Botão Primário
            </button>
            
            <button 
              className="px-4 py-2 rounded-lg text-white font-medium"
              style={{ 
                background: `linear-gradient(135deg, ${storeData.settings.primaryColor}, ${storeData.settings.secondaryColor})` 
              }}
            >
              Gradiente
            </button>
            
            <span 
              className="px-3 py-1 rounded-full text-white text-sm font-medium"
              style={{ backgroundColor: storeData.settings.accentColor }}
            >
              ● Aberto
            </span>
          </div>

          <div 
            className="h-24 rounded-lg flex items-center justify-center text-white font-bold text-lg"
            style={{ 
              background: `linear-gradient(135deg, ${storeData.settings.primaryColor}, ${storeData.settings.secondaryColor})` 
            }}
          >
            {storeData.settings.storeName}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => {
            updateSettings({
              primaryColor: '#ef4444',
              secondaryColor: '#f97316',
              accentColor: '#22c55e',
            });
          }}
          className="px-4 py-2 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 flex items-center gap-2"
        >
          <RefreshCw size={18} />
          <span>Resetar</span>
        </button>
        
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 flex items-center gap-2"
        >
          {saved ? <Check size={18} /> : null}
          <span>{saved ? 'Salvo!' : 'Aplicar Cores'}</span>
        </button>
      </div>
    </div>
  );
}
