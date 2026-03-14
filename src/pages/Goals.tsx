import React, { useState } from 'react';
import { useLifeGraphStore } from '../store/useLifeGraphStore';
import { Target, Plus, Trophy, Bot, Sparkles, Loader2, RotateCcw, Zap, Trash2, X } from 'lucide-react';
import { calculateGoalProgress } from '../utils/goalUtils';
import { parseGoalWithAI, suggestCategorization, initializeGoalsWithAI } from '../services/aiService';

export function Goals() {
  const { 
    goals, metrics, goalMetrics, 
    addGoal, addMetric, addGoalMetric, addHabit, addResource, addRelationship,
    categories, addCategory, resetGoals, debloat, deleteGoal 
  } = useLifeGraphStore();
  const [isAdding, setIsAdding] = useState(false);
  const [isBuildingWithAI, setIsBuildingWithAI] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [debloatOnReset, setDebloatOnReset] = useState(true);
  const [newGoal, setNewGoal] = useState({ name: '', description: '', category_id: '' });
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [suggestedMetrics, setSuggestedMetrics] = useState<string[]>([]);

  const userId = 'user-1';

  const handleResetAndInitialize = async () => {
    setAiLoading(true);
    try {
      // 1. Reset current goals
      resetGoals();
      
      // 2. Debloat if requested
      if (debloatOnReset) {
        debloat();
      }

      // 3. Initialize with AI
      const habitNames = useLifeGraphStore.getState().habits.map(h => h.name);
      const metricNames = useLifeGraphStore.getState().metrics.map(m => m.name);
      
      const suggestedGoals = await initializeGoalsWithAI(habitNames, metricNames);
      
      suggestedGoals.forEach((sg: any) => {
        const goalId = Math.random().toString(36).substring(2, 9);
        addGoal({
          user_id: userId,
          name: sg.name,
          description: sg.description,
          category_id: null,
          target_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days out
          color: null,
          icon: null,
          // @ts-ignore
          id: goalId
        });

        sg.metrics.forEach((sm: any) => {
          // Find metric or create it
          let metric = useLifeGraphStore.getState().metrics.find(m => m.name.toLowerCase() === sm.metricName.toLowerCase());
          let metricId = metric?.id;

          if (!metricId) {
            metricId = Math.random().toString(36).substring(2, 9);
            addMetric({
              user_id: userId,
              name: sm.metricName,
              category_id: null,
              measurement_type: 'numeric',
              data_source: 'manual',
              notes: 'Auto-created during goal initialization',
              current_value: 0,
              decay_rate: 0,
              formula: null,
              color: null,
              icon: null,
              // @ts-ignore
              id: metricId
            });
          }

          addGoalMetric({
            goal_id: goalId,
            metric_id: metricId,
            target_value: sm.targetValue,
            initial_value: sm.initialValue || 0,
            weight: sm.weight
          });
        });
      });

      setIsResetting(false);
    } catch (error) {
      console.error('Reset and Initialize error:', error);
    }
    setAiLoading(false);
  };

  const handleAiSuggest = async () => {
    if (!newGoal.name) return;
    setAiLoading(true);
    try {
      const result = await suggestCategorization(newGoal.name, 'goal', categories.map(c => ({ id: c.id, name: c.name })));
      
      let finalCategoryId = result.categoryId;
      
      if (!finalCategoryId && result.newCategoryName) {
        const existing = categories.find(c => c.name.toLowerCase() === result.newCategoryName.toLowerCase());
        if (existing) {
          finalCategoryId = existing.id;
        } else {
          addCategory({
            user_id: userId,
            name: result.newCategoryName,
            parent_id: null,
            framework: null,
            color: null,
            icon: null
          });
        }
      }

      setNewGoal(prev => ({
        ...prev,
        category_id: finalCategoryId || prev.category_id
      }));

      setSuggestedMetrics(result.suggestedMetrics || []);
    } catch (error) {
      console.error('AI Suggestion error:', error);
    }
    setAiLoading(false);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.name) return;
    
    const goalId = Math.random().toString(36).substring(2, 9);

    addGoal({
      user_id: userId,
      name: newGoal.name,
      description: newGoal.description,
      category_id: newGoal.category_id || null,
      target_date: new Date().toISOString(),
      color: null,
      icon: null,
      // @ts-ignore
      id: goalId
    });

    // Pre-assign suggested metrics
    suggestedMetrics.forEach(metricName => {
      let metric = metrics.find(m => m.name.toLowerCase() === metricName.toLowerCase());
      
      if (!metric) {
        const newMetricId = Math.random().toString(36).substring(2, 9);
        addMetric({
          user_id: userId,
          name: metricName,
          category_id: newGoal.category_id || null,
          measurement_type: 'numeric',
          data_source: 'manual',
          notes: 'Auto-created by AI',
          current_value: 0,
          decay_rate: 0,
          formula: null,
          color: null,
          icon: null,
          // @ts-ignore
          id: newMetricId
        });
        
        addGoalMetric({
          goal_id: goalId,
          metric_id: newMetricId,
          target_value: 10,
          initial_value: 0,
          weight: 1.0
        });
      } else {
        addGoalMetric({
          goal_id: goalId,
          metric_id: metric.id,
          target_value: 10,
          initial_value: metric.current_value,
          weight: 1.0
        });
      }
    });
    
    setNewGoal({ name: '', description: '', category_id: '' });
    setSuggestedMetrics([]);
    setIsAdding(false);
  };

  const handleAIBuild = async () => {
    if (!aiPrompt) return;
    setIsBuildingWithAI(true);
    try {
      const result = await parseGoalWithAI(aiPrompt);
      
      // Create Goal
      const goalId = addGoal({
        user_id: userId,
        name: result.goalName,
        description: result.description,
        target_date: new Date().toISOString(),
        color: null,
        icon: null
      });

      // Map to keep track of metric IDs created in this session
      const metricMap: Record<string, string> = {};

      result.metrics.forEach((m: any) => {
        const metricId = addMetric({
          user_id: userId,
          name: m.name,
          category_id: null,
          measurement_type: 'numeric',
          data_source: 'manual',
          notes: 'Created via AI Goal Builder',
          current_value: m.initialValue || 0,
          decay_rate: 0,
          formula: null,
          color: null,
          icon: null
        });

        metricMap[m.name.toLowerCase()] = metricId;

        addGoalMetric({
          goal_id: goalId,
          metric_id: metricId,
          target_value: m.targetValue || 100,
          initial_value: m.initialValue || 0,
          weight: m.weight || 1.0
        });
      });

      result.habits.forEach((h: any) => {
        const habitId = addHabit({
          user_id: userId,
          name: h.name,
          frequency: 'daily',
          color: null,
          icon: null
        });

        // Link to metrics if suggested
        if (h.suggestedMetrics) {
          h.suggestedMetrics.forEach((metricName: string) => {
            const metricId = metricMap[metricName.toLowerCase()] || 
                             metrics.find(m => m.name.toLowerCase() === metricName.toLowerCase())?.id;
            
            if (metricId) {
              addRelationship({
                user_id: userId,
                source_type: 'habit',
                source_id: habitId,
                target_type: 'metric',
                target_id: metricId,
                weight: 0.5,
                delay_days: 0
              });
            }
          });
        }
      });

      result.resources.forEach((r: any) => {
        addResource({
          user_id: userId,
          title: r.title,
          url: r.url,
          description: null,
          type: 'book',
          tags: []
        });
      });

      setAiPrompt('');
      setIsBuildingWithAI(false);
    } catch (error) {
      console.error('AI Build error:', error);
      setIsBuildingWithAI(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Goals</h1>
          <p className="text-zinc-400 mt-1">Set complex targets for your metrics.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsResetting(true)}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors border border-zinc-700/50"
            title="Reset and Re-initialize Goals"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Reset
          </button>
          <button 
            onClick={() => setIsBuildingWithAI(!isBuildingWithAI)}
            className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors"
          >
            <Bot className="w-5 h-5 mr-2" />
            Build with AI
          </button>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Goal
          </button>
        </div>
      </header>

      {isResetting && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6 space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Reset & Initialize Goals?</h3>
                <p className="text-sm text-zinc-400">This will clear all current goals and use AI to generate new ones based on your habits.</p>
              </div>
            </div>
            <button onClick={() => setIsResetting(false)} className="text-zinc-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-4 p-4 bg-zinc-950/50 rounded-lg border border-zinc-800">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-bold text-white uppercase tracking-wider">Debloat Mode</span>
              </div>
              <p className="text-xs text-zinc-500">Remove unused metrics and habits that aren't linked to anything.</p>
            </div>
            <button 
              onClick={() => setDebloatOnReset(!debloatOnReset)}
              className={`w-12 h-6 rounded-full transition-colors relative ${debloatOnReset ? 'bg-amber-500' : 'bg-zinc-800'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${debloatOnReset ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className="flex justify-end gap-3">
            <button 
              onClick={() => setIsResetting(false)}
              className="px-4 py-2 text-zinc-400 hover:text-white font-medium transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleResetAndInitialize}
              disabled={aiLoading}
              className="bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 text-white px-6 py-2 rounded-lg font-bold flex items-center transition-all active:scale-95"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  AI Initializing...
                </>
              ) : (
                'Confirm Reset'
              )}
            </button>
          </div>
        </div>
      )}

      {isBuildingWithAI && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-medium text-white">Build Goal with AI</h3>
          <textarea 
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="e.g. I want to run a marathon in 12 months."
            rows={3}
          />
          <div className="flex justify-end pt-4">
            <button onClick={handleAIBuild} className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-2 rounded-lg font-medium transition-colors">
              Build Graph
            </button>
          </div>
        </div>
      )}

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-medium text-white">New Goal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Name</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={newGoal.name}
                  onChange={e => setNewGoal({...newGoal, name: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 pr-10 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="e.g. Run a Marathon"
                />
                <button
                  type="button"
                  onClick={handleAiSuggest}
                  disabled={aiLoading || !newGoal.name}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-amber-400 hover:text-amber-300 disabled:text-zinc-600 transition-colors"
                  title="AI Suggest Category"
                >
                  {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Category</label>
              <select 
                value={newGoal.category_id}
                onChange={e => setNewGoal({...newGoal, category_id: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Unassigned</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-400 mb-1">Description</label>
              <textarea 
                value={newGoal.description}
                onChange={e => setNewGoal({...newGoal, description: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="e.g. Improve endurance and strength"
                rows={2}
              />
            </div>
          </div>

          {suggestedMetrics.length > 0 && (
            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <label className="block text-sm font-medium text-zinc-400 mb-1">AI Suggested Metrics</label>
              <div className="flex flex-wrap gap-2">
                {suggestedMetrics.map((m, i) => (
                  <span key={i} className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-xs font-medium flex items-center">
                    <Sparkles className="w-3 h-3 mr-1.5" />
                    {m}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-zinc-500 italic">These metrics will be automatically linked to this goal.</p>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button type="submit" className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
              Create Goal
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map(goal => {
          const progress = calculateGoalProgress(goal, goalMetrics, metrics);
          const isCompleted = progress >= 100;

          return (
            <div key={goal.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors flex flex-col relative overflow-hidden group">
              <button 
                onClick={() => deleteGoal(goal.id)}
                className="absolute top-2 right-2 p-1.5 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all z-10"
                title="Delete Goal"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              {isCompleted && (
                <div className="absolute top-0 right-0 p-4">
                  <Trophy className="w-6 h-6 text-amber-500" />
                </div>
              )}
              
              <div className="mb-4">
                <h3 className="text-lg font-medium text-white">{goal.name}</h3>
                <p className="text-sm text-zinc-400 mt-1">{goal.description}</p>
              </div>

              <div className="space-y-3 mb-4">
                {goalMetrics.filter(gm => gm.goal_id === goal.id).map(gm => {
                  const metric = metrics.find(m => m.id === gm.metric_id);
                  if (!metric) return null;
                  
                  // Calculate individual metric progress
                  let metricProgress = 0;
                  const range = Math.abs(gm.target_value - gm.initial_value);
                  if (range > 0) {
                    if (gm.target_value > gm.initial_value) {
                      metricProgress = Math.max(0, Math.min(100, ((metric.current_value - gm.initial_value) / range) * 100));
                    } else {
                      metricProgress = Math.max(0, Math.min(100, ((gm.initial_value - metric.current_value) / range) * 100));
                    }
                  } else {
                    metricProgress = metric.current_value >= gm.target_value ? 100 : 0;
                  }

                  return (
                    <div key={gm.id} className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-medium uppercase tracking-wider">
                        <span className="text-zinc-400">{metric.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-300">
                            {metric.current_value} <span className="text-zinc-600 normal-case">/ {gm.target_value}</span>
                          </span>
                          <span className="text-indigo-400 font-mono">{metricProgress.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-zinc-800/50 rounded-full h-1">
                        <div 
                          className="bg-indigo-500/70 h-1 rounded-full transition-all duration-500" 
                          style={{ width: `${metricProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-auto pt-4 border-t border-zinc-800/50">
                <div className="flex justify-between items-end mb-2">
                  <div className="text-sm font-medium text-zinc-300">
                    <span className="text-amber-400 font-mono text-lg">{progress.toFixed(1)}%</span>
                  </div>
                  <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Progress
                  </div>
                </div>
                
                <div className="w-full bg-zinc-800 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-1000 ${isCompleted ? 'bg-amber-500' : 'bg-amber-500/70'}`} 
                    style={{ width: `${Math.min(100, progress)}%` }}
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
