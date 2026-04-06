import React, { useState } from 'react';
import ProductManager from '../components/admin/ProductManager';
import CategoryManager from '../components/admin/CategoryManager';
import ConfigManager from '../components/admin/ConfigManager';
import { Package, ListOrdered, Settings } from 'lucide-react';

const AdminView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'config'>('products');

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 text-xl font-bold border-b border-slate-800">
          Admin Panel
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
              activeTab === 'products' ? 'bg-red-600 text-white' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Package size={20} />
            <span>Produtos</span>
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
              activeTab === 'categories' ? 'bg-red-600 text-white' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <ListOrdered size={20} />
            <span>Categorias</span>
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
              activeTab === 'config' ? 'bg-red-600 text-white' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Settings size={20} />
            <span>Configurações</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm h-16 flex items-center px-8">
          <h2 className="text-lg font-semibold text-gray-800 capitalize">
            {activeTab}
          </h2>
        </header>
        
        <main className="flex-1 overflow-y-auto p-8">
          {activeTab === 'products' && <ProductManager />}
          {activeTab === 'categories' && <CategoryManager />}
          {activeTab === 'config' && <ConfigManager />}
        </main>
      </div>
    </div>
  );
};

export default AdminView;
