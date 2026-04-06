import { useStoreContext } from '../../context/StoreContext';
import { DAYS_OF_WEEK, DayOfWeek } from '../../types';

export function HoursTab() {
  const { storeData, updateSettings, isStoreOpen } = useStoreContext();
  const { businessHours } = storeData.settings;
  const open = isStoreOpen();

  const handleToggleDay = (day: DayOfWeek) => {
    updateSettings({
      businessHours: {
        ...businessHours,
        [day]: {
          ...businessHours[day],
          enabled: !businessHours[day].enabled,
        },
      },
    });
  };

  const handleTimeChange = (day: DayOfWeek, field: 'open' | 'close', value: string) => {
    updateSettings({
      businessHours: {
        ...businessHours,
        [day]: {
          ...businessHours[day],
          [field]: value,
        },
      },
    });
  };

  const getCurrentDayInfo = () => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as DayOfWeek[];
    const today = days[new Date().getDay()];
    const hours = businessHours[today];
    
    return {
      day: DAYS_OF_WEEK.find(d => d.key === today)?.label || '',
      hours: hours?.enabled ? `${hours.open} - ${hours.close}` : 'Fechado',
      isOpen: open,
    };
  };

  const currentDay = getCurrentDayInfo();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Horário de Funcionamento</h1>

      {/* Current Status Card */}
      <div className={`rounded-xl p-4 mb-6 ${open ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${open ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className={`font-semibold ${open ? 'text-green-800' : 'text-red-800'}`}>
                {open ? 'Loja Aberta' : 'Loja Fechada'}
              </span>
            </div>
            <p className={`text-sm mt-1 ${open ? 'text-green-700' : 'text-red-700'}`}>
              Hoje ({currentDay.day}): {currentDay.hours}
            </p>
          </div>
          
          <div className="text-4xl">
            {open ? '🟢' : '🔴'}
          </div>
        </div>
      </div>

      {/* Scheduling Option */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <h3 className="font-semibold text-gray-900">Aceitar Agendamentos</h3>
            <p className="text-sm text-gray-500">
              Permite que clientes façam pedidos mesmo quando a loja está fechada
            </p>
          </div>
          
          <div className="relative">
            <input
              type="checkbox"
              checked={storeData.settings.acceptScheduling}
              onChange={(e) => updateSettings({ acceptScheduling: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500" />
          </div>
        </label>
      </div>

      {/* Hours Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Dias da Semana</h2>
          <p className="text-sm text-gray-500">Configure o horário de funcionamento para cada dia</p>
        </div>

        <div className="divide-y divide-gray-100">
          {DAYS_OF_WEEK.map(({ key, label }) => {
            const hours = businessHours[key];
            const isToday = new Date().getDay() === DAYS_OF_WEEK.findIndex(d => d.key === key);
            
            return (
              <div 
                key={key} 
                className={`flex items-center gap-4 p-4 ${isToday ? 'bg-blue-50' : ''}`}
              >
                {/* Toggle */}
                <label className="relative inline-flex cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hours.enabled}
                    onChange={() => handleToggleDay(key)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500" />
                </label>

                {/* Day Name */}
                <div className="flex-1">
                  <span className={`font-medium ${hours.enabled ? 'text-gray-900' : 'text-gray-400'}`}>
                    {label}
                  </span>
                  {isToday && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      Hoje
                    </span>
                  )}
                </div>

                {/* Time Inputs */}
                {hours.enabled ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={hours.open}
                      onChange={(e) => handleTimeChange(key, 'open', e.target.value)}
                      className="p-2 border border-gray-200 rounded-lg text-sm"
                    />
                    <span className="text-gray-400">até</span>
                    <input
                      type="time"
                      value={hours.close}
                      onChange={(e) => handleTimeChange(key, 'close', e.target.value)}
                      className="p-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                ) : (
                  <span className="text-gray-400 text-sm">Fechado</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tips */}
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <h3 className="font-medium text-amber-800 mb-2">💡 Dicas</h3>
        <ul className="text-sm text-amber-700 space-y-1">
          <li>• Para funcionar após a meia-noite, coloque o horário de fechamento (ex: 01:00)</li>
          <li>• O status "Aberto/Fechado" é atualizado automaticamente</li>
          <li>• Com agendamentos ativados, clientes podem pedir a qualquer hora</li>
        </ul>
      </div>
    </div>
  );
}
