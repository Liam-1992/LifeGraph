import React, { useState } from 'react';
import { useLifeGraphStore } from '../store/useLifeGraphStore';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';

export function Categories() {
  const { categories, metrics, addCategory, updateCategory, deleteCategory, updateMetric } = useLifeGraphStore();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleAdd = () => {
    if (!newCategoryName) return;
    addCategory({ name: newCategoryName, user_id: 'user-1', parent_id: null, framework: null, color: null, icon: null });
    setNewCategoryName('');
  };

  const handleEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const handleSave = (id: string) => {
    updateCategory(id, { name: editName });
    setEditingId(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-white">Categories</h1>
        <p className="text-zinc-400 mt-1">Organize your metrics into categories.</p>
      </header>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white"
            placeholder="New category name..."
          />
          <button onClick={handleAdd} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center">
            <Plus className="w-4 h-4 mr-2" /> Add
          </button>
        </div>

        <div className="space-y-4">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center justify-between bg-zinc-800/50 p-4 rounded-lg border border-zinc-700">
              {editingId === category.id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-white"
                />
              ) : (
                <span className="font-medium text-white">{category.name}</span>
              )}
              
              <div className="flex gap-2">
                {editingId === category.id ? (
                  <button onClick={() => handleSave(category.id)} className="text-emerald-400"><Save className="w-5 h-5" /></button>
                ) : (
                  <button onClick={() => handleEdit(category.id, category.name)} className="text-zinc-400"><Edit2 className="w-5 h-5" /></button>
                )}
                <button onClick={() => deleteCategory(category.id)} className="text-rose-400"><Trash2 className="w-5 h-5" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Assign Metrics</h2>
        <div className="space-y-4">
          {metrics.map((metric) => (
            <div key={metric.id} className="flex items-center justify-between bg-zinc-800/50 p-4 rounded-lg border border-zinc-700">
              <span className="text-white">{metric.name}</span>
              <select
                value={metric.category_id || ''}
                onChange={(e) => updateMetric(metric.id, { category_id: e.target.value || null })}
                className="bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-white"
              >
                <option value="">No Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
