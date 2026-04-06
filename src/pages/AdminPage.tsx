import { useState } from 'react';
import { Menu } from 'lucide-react';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { ProductsTab } from '../components/admin/ProductsTab';
import { CategoriesTab } from '../components/admin/CategoriesTab';
import { HoursTab } from '../components/admin/HoursTab';
import { AppearanceTab } from '../components/admin/AppearanceTab';
import { SettingsTab } from '../components/admin/SettingsTab';

export function AdminPage() {
  const [activeTab, setActiveTab] = useState('products');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'products':
        return <ProductsTab />;
      case 'categories':
        return <CategoriesTab />;
      case 'hours':
        return <HoursTab />;
      case 'appearance':
        return <AppearanceTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <ProductsTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu size={24} />
          </button>
          <h1 className="font-bold text-lg">Painel Admin</h1>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <div className="max-w-6xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
