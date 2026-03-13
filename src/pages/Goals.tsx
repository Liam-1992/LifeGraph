import React, { useState } from 'react';
import { useLifeGraphStore } from '../store/useLifeGraphStore';
import { Target, Plus, Trophy } from 'lucide-react';

export function Goals() {
  const { goals, metrics, addGoal } = useLifeGraphStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: '', description: '', target_metric_id: '', target_value: 10 });

  const userId = 'user-1';

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.name || !newGoal.target_metric_id) return;
    
    addGoal({
      user_id: userId,
      name: newGoal.name,
      description: newGoal.description,
      target_metric_id: newGoal.target_metric_id,
      target_value: Number(newGoal.target_value)
    });
    
    setNewGoal({ name: '', description: '', target_metric_id: '', target_value: 10 });
    setIsAdding(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Goals</h1>
          <p className="text-zinc-400 mt-1">Set targets for your metrics.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Goal
        </button>
      </header>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-medium text-white">New Goal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Name</label>
              <input 
                type="text" 
                value={newGoal.name}
                onChange={e => setNewGoal({...newGoal, name: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="e.g. Laser Focus"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Target Metric</label>
              <select 
                value={newGoal.target_metric_id}
                onChange={e => setNewGoal({...newGoal, target_metric_id: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Select Metric</option>
                {metrics.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-400 mb-1">Description</label>
              <textarea 
                value={newGoal.description}
                onChange={e => setNewGoal({...newGoal, description: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="e.g. Reach Focus level 10"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Target Value</label>
              <input 
                type="number" 
                value={newGoal.target_value}
                onChange={e => setNewGoal({...newGoal, target_value: Number(e.target.value)})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button type="submit" className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
              Create Goal
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map(goal => {
          const metric = metrics.find(m => m.id === goal.target_metric_id);
          if (!metric) return null;
          
          const progress = Math.min(100, (metric.current_value / goal.target_value) * 100);
          const isCompleted = progress >= 100;

          return (
            <div key={goal.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors flex flex-col relative overflow-hidden">
              {isCompleted && (
                <div className="absolute top-0 right-0 p-4">
                  <Trophy className="w-6 h-6 text-amber-500" />
                </div>
              )}
              
              <div className="mb-4">
                <h3 className="text-lg font-medium text-white">{goal.name}</h3>
                <p className="text-sm text-zinc-400 mt-1">{goal.description}</p>
              </div>
              
              <div className="mt-auto pt-4">
                <div className="flex justify-between items-end mb-2">
                  <div className="text-sm font-medium text-zinc-300">
                    <span className="text-amber-400 font-mono text-lg">{metric.current_value.toFixed(1)}</span>
                    <span className="text-zinc-500 mx-1">/</span>
                    <span className="font-mono">{goal.target_value}</span>
                  </div>
                  <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    {metric.name}
                  </div>
                </div>
                
                <div className="w-full bg-zinc-800 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-1000 ${isCompleted ? 'bg-amber-500' : 'bg-amber-500/70'}`} 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
