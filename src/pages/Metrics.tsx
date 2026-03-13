import React, { useState } from 'react';
import { useLifeGraphStore } from '../store/useLifeGraphStore';
import { BarChart2, Plus, TrendingUp, Activity, Bot, Loader2, X } from 'lucide-react';
import { aiCoachService } from '../services/aiCoach';
import ReactMarkdown from 'react-markdown';

function MetricAICoach({ metricName, onClose }: { metricName: string, onClose: () => void }) {
  const [advice, setAdvice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { metrics, habits } = useLifeGraphStore();

  React.useEffect(() => {
    const fetchAdvice = async () => {
      try {
        const userData = {
          metrics: metrics.map(m => ({ name: m.name, value: m.current_value })),
          habits: habits.map(h => ({ name: h.name, frequency: h.frequency }))
        };
        const response = await aiCoachService.sendMessage([
          { role: 'user', content: `What are the best habits and resources to improve my ${metricName} metric? Please analyze my current data and provide specific recommendations.` }
        ], userData);
        setAdvice(response);
      } catch (error) {
        setAdvice("Failed to load AI advice.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAdvice();
  }, [metricName, metrics, habits]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center text-indigo-400">
            <Bot className="w-5 h-5 mr-2" />
            <h3 className="font-semibold text-white">AI Coach: Improve {metricName}</h3>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors p-1 rounded-md hover:bg-zinc-800">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-40 text-zinc-400">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
              <p>Analyzing your data to suggest improvements for {metricName}...</p>
            </div>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800">
              <ReactMarkdown>{advice || ''}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Metrics() {
  const { metrics, addMetric, categories: storeCategories } = useLifeGraphStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newMetric, setNewMetric] = useState({ name: '', category_id: '', measurement_type: 'numeric' as const });
  const [activeMetricAI, setActiveMetricAI] = useState<string | null>(null);

  const categories = storeCategories;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMetric.name) return;
    
    addMetric({
      user_id: 'user-1',
      name: newMetric.name,
      category_id: newMetric.category_id,
      measurement_type: newMetric.measurement_type,
      current_value: 0,
      data_source: 'manual',
      notes: null,
      decay_rate: 0,
      formula: null
    });
    
    setNewMetric({ name: '', category_id: '', measurement_type: 'numeric' });
    setIsAdding(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Metrics</h1>
          <p className="text-zinc-400 mt-1">Track your personal development stats.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Metric
        </button>
      </header>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-medium text-white">New Metric</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Name</label>
              <input 
                type="text" 
                value={newMetric.name}
                onChange={e => setNewMetric({...newMetric, name: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. Focus"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Category</label>
              <select 
                value={newMetric.category_id}
                onChange={e => setNewMetric({...newMetric, category_id: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select a category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button type="submit" className="w-full bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                Create
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-8">
        {categories.map(category => {
          const categoryMetrics = metrics.filter(m => m.category_id === category.id);
          if (categoryMetrics.length === 0) return null;
          return (
            <div key={category.id} className="space-y-4">
              <h2 className="text-xl font-semibold text-white flex items-center border-b border-zinc-800 pb-2">
                <Activity className="w-5 h-5 mr-2 text-emerald-500" />
                {category.name.toUpperCase()}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryMetrics.map(metric => (
                  <div key={metric.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-medium text-white">{metric.name}</h3>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setActiveMetricAI(metric.name)}
                          className="bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 text-xs px-2 py-1 rounded-md transition-colors flex items-center"
                          title="Ask AI how to improve this metric"
                        >
                          <Bot className="w-3 h-3 mr-1" />
                          Ask AI
                        </button>
                        <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-1 rounded-md">Level</span>
                      </div>
                    </div>
                    <div className="flex items-end justify-between">
                      <div className="text-4xl font-bold text-emerald-400 font-mono">
                        {metric.current_value.toFixed(1)}
                      </div>
                      <div className="flex items-center text-emerald-500 text-sm font-medium">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        +0.2
                      </div>
                    </div>
                    <div className="mt-4 w-full bg-zinc-800 rounded-full h-1">
                      <div className="bg-emerald-500 h-1 rounded-full" style={{ width: `${(metric.current_value % 10) * 10}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {activeMetricAI && (
        <MetricAICoach 
          metricName={activeMetricAI} 
          onClose={() => setActiveMetricAI(null)} 
        />
      )}
    </div>
  );
}
