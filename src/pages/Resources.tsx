import React, { useState } from 'react';
import { useLifeGraphStore } from '../store/useLifeGraphStore';
import { BookOpen, Plus, ExternalLink, Tag, Bot, Loader2, Trash2 } from 'lucide-react';
import { categorizeMultipleResources, cleanupResourcesWithAI } from '../services/aiService';

export function Resources() {
  const { resources, addResource, updateResource, deleteResource, categories, addCategory } = useLifeGraphStore();
  const [isAdding, setIsAdding] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [newResource, setNewResource] = useState({ title: '', url: '', description: '', type: 'book' as const, tags: '' });

  const userId = 'user-1';

  const handleCategorize = async () => {
    if (resources.length === 0) return;
    setIsCategorizing(true);
    try {
      const resourcesToCategorize = resources.map(r => ({ id: r.id, title: r.title, type: r.type }));
      const existingCategories = categories.map(c => ({ id: c.id, name: c.name }));
      
      const results = await categorizeMultipleResources(resourcesToCategorize, existingCategories);
      
      results.forEach((result: any) => {
        let categoryId = result.categoryId;
        
        if (result.newCategoryName && !categoryId) {
          categoryId = addCategory({
            user_id: userId,
            name: result.newCategoryName,
            parent_id: null,
            framework: null,
            color: '#6366f1',
            icon: 'folder'
          });
        }
        
        if (categoryId) {
          updateResource(result.resourceId, { category_id: categoryId });
        }
      });
    } catch (error) {
      console.error('Failed to categorize resources:', error);
    }
    setIsCategorizing(false);
  };

  const handleCleanup = async () => {
    if (resources.length === 0) return;
    setIsCleaningUp(true);
    try {
      const resourcesToEvaluate = resources.map(r => ({ 
        id: r.id, 
        title: r.title, 
        description: r.description, 
        type: r.type 
      }));
      
      const idsToKeep = await cleanupResourcesWithAI(resourcesToEvaluate);
      
      resources.forEach(r => {
        if (!idsToKeep.includes(r.id)) {
          deleteResource(r.id);
        }
      });
    } catch (error) {
      console.error('Failed to cleanup resources:', error);
    }
    setIsCleaningUp(false);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResource.title) return;
    
    addResource({
      user_id: userId,
      title: newResource.title,
      url: newResource.url,
      description: newResource.description,
      type: newResource.type,
      tags: newResource.tags.split(',').map(t => t.trim()).filter(Boolean)
    });
    
    setNewResource({ title: '', url: '', description: '', type: 'book', tags: '' });
    setIsAdding(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Resources</h1>
          <p className="text-zinc-400 mt-1">Knowledge base for your personal development.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleCleanup}
            disabled={isCleaningUp || resources.length === 0}
            className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors"
          >
            {isCleaningUp ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Trash2 className="w-5 h-5 mr-2 text-rose-400" />}
            Cleanup
          </button>
          <button 
            onClick={handleCategorize}
            disabled={isCategorizing || resources.length === 0}
            className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors"
          >
            {isCategorizing ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Bot className="w-5 h-5 mr-2 text-indigo-400" />}
            Categorize
          </button>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Resource
          </button>
        </div>
      </header>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-medium text-white">New Resource</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Title</label>
              <input 
                type="text" 
                value={newResource.title}
                onChange={e => setNewResource({...newResource, title: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Deep Work"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Type</label>
              <select 
                value={newResource.type}
                onChange={e => setNewResource({...newResource, type: e.target.value as any})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="book">Book</option>
                <option value="article">Article</option>
                <option value="video">Video</option>
                <option value="course">Course</option>
                <option value="tool">Tool</option>
                <option value="paper">Research Paper</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">URL</label>
              <input 
                type="url" 
                value={newResource.url}
                onChange={e => setNewResource({...newResource, url: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Tags (comma separated)</label>
              <input 
                type="text" 
                value={newResource.tags}
                onChange={e => setNewResource({...newResource, tags: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="focus, productivity"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-400 mb-1">Description</label>
              <textarea 
                value={newResource.description}
                onChange={e => setNewResource({...newResource, description: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={2}
              />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button type="submit" className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
              Save Resource
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.map(resource => (
          <div key={resource.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-medium text-white">{resource.title}</h3>
              <div className="flex gap-2 items-center">
                {resource.category_id && (
                  <span className="bg-indigo-500/10 text-indigo-400 text-xs px-2 py-1 rounded-md uppercase tracking-wider">
                    {categories.find(c => c.id === resource.category_id)?.name || 'Categorized'}
                  </span>
                )}
                <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded-md uppercase tracking-wider">
                  {resource.type}
                </span>
                <button 
                  onClick={() => deleteResource(resource.id)}
                  className="text-zinc-500 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-sm text-zinc-400 mb-4 flex-1">{resource.description}</p>
            
            <div className="mt-auto space-y-4">
              {resource.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {resource.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center px-2 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-400">
                      <Tag className="w-3 h-3 mr-1" /> {tag}
                    </span>
                  ))}
                </div>
              )}
              
              {resource.url && (
                <a 
                  href={resource.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 mr-1" /> Open Link
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
