import React, { useState } from 'react';
import { useLifeGraphStore } from '../store/useLifeGraphStore';
import { CheckCircle, Plus, Calendar, Link as LinkIcon, Flame, Trophy } from 'lucide-react';
import { calculateStreak } from '../lib/streakUtils';

export function Habits() {
  const { habits, metrics, relationships, addHabit, addRelationship, logHabit, habitLogs } = useLifeGraphStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newHabit, setNewHabit] = useState({ name: '', frequency: 'daily' });
  const [linkedMetric, setLinkedMetric] = useState('');
  const [weight, setWeight] = useState(0.5);

  const userId = 'user-1';
  const today = new Date().toISOString().split('T')[0];
  const todayLogs = habitLogs.filter(log => log.completed_at.startsWith(today));

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabit.name) return;
    
    const habitId = Math.random().toString(36).substring(2, 9);
    
    addHabit({
      ...newHabit,
      user_id: userId,
      // @ts-ignore - hacking the ID for the mock relationship
      id: habitId,
    });
    
    if (linkedMetric) {
      addRelationship({
        user_id: userId,
        source_type: 'habit',
        source_id: habitId,
        target_type: 'metric',
        target_id: linkedMetric,
        weight: Number(weight),
        delay_days: 0
      });
    }
    
    setNewHabit({ name: '', frequency: 'daily' });
    setLinkedMetric('');
    setWeight(0.5);
    setIsAdding(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Habits</h1>
          <p className="text-zinc-400 mt-1">Actions that drive your metrics.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Habit
        </button>
      </header>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-medium text-white">New Habit</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Name</label>
              <input 
                type="text" 
                value={newHabit.name}
                onChange={e => setNewHabit({...newHabit, name: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Meditation"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Frequency</label>
              <select 
                value={newHabit.frequency}
                onChange={e => setNewHabit({...newHabit, frequency: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="3x/week">3x / Week</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Link to Metric</label>
              <select 
                value={linkedMetric}
                onChange={e => setLinkedMetric(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">None</option>
                {metrics.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            {linkedMetric && (
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Impact Weight (+{weight})</label>
                <input 
                  type="range" 
                  min="0.1" max="2" step="0.1"
                  value={weight}
                  onChange={e => setWeight(Number(e.target.value))}
                  className="w-full mt-2"
                />
              </div>
            )}
          </div>
          <div className="flex justify-end pt-4">
            <button type="submit" className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
              Create Habit
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {habits.map(habit => {
          const isCompleted = todayLogs.some(log => log.habit_id === habit.id);
          const relatedRels = relationships.filter(r => r.source_type === 'habit' && r.source_id === habit.id);
          const { current, longest } = calculateStreak(habit.id, habitLogs);
          
          return (
            <div key={habit.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium text-white">{habit.name}</h3>
                  <div className="flex items-center text-zinc-500 text-sm mt-1">
                    <Calendar className="w-4 h-4 mr-1" />
                    {habit.frequency}
                  </div>
                </div>
                <button
                  onClick={() => !isCompleted && logHabit(habit.id, userId)}
                  disabled={isCompleted}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    isCompleted 
                      ? 'bg-blue-500/20 text-blue-500 border border-blue-500/30' 
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white border border-zinc-700'
                  }`}
                >
                  <CheckCircle className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex gap-4 mb-4">
                <div className="flex items-center text-orange-400">
                  <Flame className="w-4 h-4 mr-1" />
                  <span className="font-bold">{current}</span>
                </div>
                <div className="flex items-center text-yellow-500">
                  <Trophy className="w-4 h-4 mr-1" />
                  <span className="font-bold">{longest}</span>
                </div>
              </div>
              
              <div className="mt-auto pt-4 border-t border-zinc-800/50">
                <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 flex items-center">
                  <LinkIcon className="w-3 h-3 mr-1" /> Impacts
                </h4>
                <div className="flex flex-wrap gap-2">
                  {relatedRels.length > 0 ? relatedRels.map(rel => {
                    const metric = metrics.find(m => m.id === rel.target_id);
                    if (!metric) return null;
                    return (
                      <span key={rel.id} className="inline-flex items-center px-2 py-1 rounded-md bg-zinc-800/50 border border-zinc-700/50 text-xs font-medium text-zinc-300">
                        {metric.name} <span className="text-emerald-400 ml-1">+{rel.weight}</span>
                      </span>
                    );
                  }) : (
                    <span className="text-xs text-zinc-600 italic">No linked metrics</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
