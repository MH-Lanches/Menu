import React, { useState } from 'react';
import { useStore } from '../../hooks/useStore';
import { StoreConfig, DayConfig } from '../../types/store';
import { Save, Clock, Palette, Truck } from 'lucide-react';

interface ConfigManagerProps {}

const ConfigManager: React.FC<ConfigManagerProps> = () => {
  const { state, updateState } = useStore();
  const [isSaving, setIsSaving] = useState(false);
  
  // Local form state to avoid immediate persistence on every keystroke
  const [config, setConfig] = useState<StoreConfig>(state.config);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    updateState(prev => ({ ...prev, config }));
    setIsSaving(false);
    alert('Configurações salvas com sucesso!');
  };

  const updateDay = (day: string, field: keyof DayConfig, value: string | boolean) => {
    setConfig(prev => ({
      ...prev,
      openingHours: {
        ...prev.openingHours,
        [day]: {
          ...prev.openingHours[day],
          [field]: value
        }
      }
    }));
  };

  const daysOfWeek = [
    { id: '0', name: 'Segunda-feira' },
    { id: '1', name: 'Terça-feira' },
    { id: '2', name: 'Quarta-feira' },
    { id: '3', name: 'Quinta-feira' },
    { id: '4', name: 'Sexta-feira' },
    { id: '5', name: 'Sábado' },
    { id: '6', name: 'Domingo' },
  ];

  return (
    <div className="max-w-4xl space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-800">Configurações Gerais</h3>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          <Save size={18} />
          {isSaving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>

      {/* Branding Section */}
      <section className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-2 text-red-600 font-semibold border-b pb-4">
          <Palette size={20} />
          <span>Identidade Visual e Nome</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Nome da Loja</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
              value={config.name}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Texto do Rodapé</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
              value={config.footerText}
              onChange={(e) => setConfig({ ...config, footerText: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Cor Primária</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                className="h-10 w-20 border-none"
                value={config.primaryColor}
                onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
              />
              <span className="text-sm text-gray-500 uppercase">{config.primaryColor}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Cor Secundária</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                className="h-10 w-20 border-none"
                value={config.secondaryColor}
                onChange={(e) => setConfig({ ...config, secondaryColor: e.target.value })}
              />
              <span className="text-sm text-gray-500 uppercase">{config.secondaryColor}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Delivery Section */}
      <section className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-2 text-red-600 font-semibold border-b pb-4">
          <Truck size={20} />
          <span>Entrega</span>
        </div>
        <div className="space-y-1.5 max-w-xs">
          <label className="text-sm font-medium text-gray-700">Taxa de Entrega Fixa (R$)</label>
          <input
            type="number"
            step="0.01"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
            value={config.deliveryFee}
            onChange={(e) => setConfig({ ...config, deliveryFee: parseFloat(e.target.value) })}
          />
        </div>
      </section>

      {/* Hours Section */}
      <section className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-2 text-red-600 font-semibold border-b pb-4">
          <Clock size={20} />
          <span>Horário de Funcionamento</span>
        </div>

        <div className="space-y-4">
          {daysOfWeek.map((day) => (
            <div key={day.id} className="flex flex-col md:flex-row md:items-center gap-4 p-4 border border-gray-100 rounded-lg">
              <div className="w-32 font-medium text-gray-700">{day.name}</div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Abre:</span>
                  <input
                    type="time"
                    className="px-2 py-1 border rounded text-sm"
                    value={config.openingHours[day.id].open}
                    onChange={(e) => updateDay(day.id, 'open', e.target.value)}
                  />
                </div>
                <span className="text-gray-400">até</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Fecha:</span>
                  <input
                    type="time"
                    className="px-2 py-1 border rounded text-sm"
                    value={config.openingHours[day.id].close}
                    onChange={(e) => updateDay(day.id, 'close', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <label className="text-sm text-gray-600">Aberto?</label>
                <input
                  type="checkbox"
                  className="w-5 h-5 accent-red-600"
                  checked={config.openingHours[day.id].isOpen}
                  onChange={(e) => updateDay(day.id, 'isOpen', e.target.checked)}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ConfigManager;
