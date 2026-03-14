import React, { useState, useMemo } from 'react';
import { useLifeGraphStore } from '../store/useLifeGraphStore';
import { CheckCircle, Plus, Calendar, Link as LinkIcon, Flame, Trophy, ChevronRight, ChevronDown, Folder, Target, X, Bot, Trash2 } from 'lucide-react';
import { calculateStreak } from '../lib/streakUtils';
import { Habit, Category, Goal } from '../types';
import { suggestCategorization, buildHabitsWithAI, categorizeMultipleHabits } from '../services/aiService';
import { Sparkles, Loader2 } from 'lucide-react';

export function Habits() {
  const { 
    habits, metrics, relationships, 
    addHabit, logHabit, habitLogs, 
    categories, goals, goalMetrics, 
    updateHabit, addCategory, addMetric, 
    addRelationship, deleteHabit 
  } = useLifeGraphStore();
  const [isAdding, setIsAdding] = useState(false);
  const [isBuildingWithAI, setIsBuildingWithAI] = useState(false);
  const [newHabit, setNewHabit] = useState({ name: '', frequency: 'daily', category_id: '' });
  const [aiPrompt, setAiPrompt] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [aiLoading, setAiLoading] = useState(false);
  const [suggestedMetrics, setSuggestedMetrics] = useState<string[]>([]);

  const userId = 'user-1';
  const today = new Date().toISOString().split('T')[0];
  const todayLogs = habitLogs.filter(log => log.completed_at.startsWith(today));

  const handleAIBuild = async () => {
    if (!aiPrompt) return;
    setAiLoading(true);
    try {
      const suggestedHabits = await buildHabitsWithAI(aiPrompt);
      
      suggestedHabits.forEach((sh: any) => {
        const habitId = addHabit({
          user_id: userId,
          name: sh.name,
          frequency: sh.frequency || 'daily',
          category_id: null,
          color: null,
          icon: null
        });

        // Link suggested metrics
        if (sh.suggestedMetrics) {
          sh.suggestedMetrics.forEach((metricName: string) => {
            let metric = metrics.find(m => m.name.toLowerCase() === metricName.toLowerCase());
            let metricId = metric?.id;

            if (!metricId) {
              metricId = addMetric({
                user_id: userId,
                name: metricName,
                category_id: null,
                measurement_type: 'numeric',
                data_source: 'manual',
                notes: 'Auto-created by AI habit builder',
                current_value: 0,
                decay_rate: 0,
                formula: null,
                color: null,
                icon: null
              });
            }

            addRelationship({
              user_id: userId,
              source_type: 'habit',
              source_id: habitId,
              target_type: 'metric',
              target_id: metricId,
              weight: 0.5,
              delay_days: 0
            });
          });
        }
      });

      setAiPrompt('');
      setIsBuildingWithAI(false);
    } catch (error) {
      console.error('AI Build error:', error);
    }
    setAiLoading(false);
  };

  const handleAiSuggest = async () => {
    if (!newHabit.name) return;
    setAiLoading(true);
    try {
      const result = await suggestCategorization(newHabit.name, 'habit', categories.map(c => ({ id: c.id, name: c.name })));
      
      let finalCategoryId = result.categoryId;
      
      if (!finalCategoryId && result.newCategoryName) {
        const existing = categories.find(c => c.name.toLowerCase() === result.newCategoryName.toLowerCase());
        if (existing) {
          finalCategoryId = existing.id;
        } else {
          finalCategoryId = addCategory({
            user_id: userId,
            name: result.newCategoryName,
            parent_id: null,
            framework: null,
            color: null,
            icon: null
          });
        }
      }

      setNewHabit(prev => ({
        ...prev,
        category_id: finalCategoryId || prev.category_id
      }));

      setSuggestedMetrics(result.suggestedMetrics || []);
    } catch (error) {
      console.error('AI Suggestion error:', error);
    }
    setAiLoading(false);
  };

  const handleCategorizeAll = async () => {
    if (habits.length === 0) return;
    setAiLoading(true);
    try {
      const habitList = habits.map(h => ({ id: h.id, name: h.name }));
      const categoryList = categories.map(c => ({ id: c.id, name: c.name }));
      const results = await categorizeMultipleHabits(habitList, categoryList);

      // Track newly created categories to avoid duplicates in the same batch
      const newCategoriesMap: Record<string, string> = {};

      for (const res of results) {
        let finalCategoryId = res.categoryId;
        
        if (!finalCategoryId && res.newCategoryName) {
          const normalizedName = res.newCategoryName.toLowerCase();
          
          // Check if we already created it in this batch
          if (newCategoriesMap[normalizedName]) {
            finalCategoryId = newCategoriesMap[normalizedName];
          } else {
            // Check if it exists in the store
            const existing = categories.find(c => c.name.toLowerCase() === normalizedName);
            if (existing) {
              finalCategoryId = existing.id;
            } else {
              // Create it
              finalCategoryId = addCategory({
                user_id: userId,
                name: res.newCategoryName,
                parent_id: null,
                framework: null,
                color: null,
                icon: null
              });
              newCategoriesMap[normalizedName] = finalCategoryId;
            }
          }
        }

        if (finalCategoryId) {
          updateHabit(res.habitId, { category_id: finalCategoryId });
        }
      }
    } catch (error) {
      console.error('Categorization error:', error);
    }
    setAiLoading(false);
  };

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabit.name) return;
    
    const habitId = addHabit({
      name: newHabit.name,
      frequency: newHabit.frequency,
      category_id: newHabit.category_id || null,
      user_id: userId,
      color: null,
      icon: null
    });

    // Pre-assign suggested metrics
    suggestedMetrics.forEach(metricName => {
      // Find if metric already exists
      let metric = metrics.find(m => m.name.toLowerCase() === metricName.toLowerCase());
      
      if (!metric) {
        // Create the metric if it doesn't exist
        const newMetricId = addMetric({
          user_id: userId,
          name: metricName,
          category_id: newHabit.category_id || null,
          measurement_type: 'numeric',
          data_source: 'manual',
          notes: 'Auto-created by AI',
          current_value: 0,
          decay_rate: 0,
          formula: null,
          color: null,
          icon: null
        });
        
        addRelationship({
          user_id: userId,
          source_type: 'habit',
          source_id: habitId,
          target_type: 'metric',
          target_id: newMetricId,
          weight: 0.5,
          delay_days: 0
        });
      } else {
        addRelationship({
          user_id: userId,
          source_type: 'habit',
          source_id: habitId,
          target_type: 'metric',
          target_id: metric.id,
          weight: 0.5,
          delay_days: 0
        });
      }
    });
    
    setNewHabit({ name: '', frequency: 'daily', category_id: '' });
    setSuggestedMetrics([]);
    setIsAdding(false);
  };

  // Identify multi-metric goals
  const multiMetricGoals = useMemo(() => {
    return goals.filter(goal => {
      const linkedMetrics = goalMetrics.filter(gm => gm.goal_id === goal.id);
      return linkedMetrics.length > 1;
    });
  }, [goals, goalMetrics]);

  // Group habits
  const groupedHabits = useMemo(() => {
    const groups: Record<string, Habit[]> = {
      unassigned: []
    };

    // 1. Multi-metric goal "categories"
    multiMetricGoals.forEach(goal => {
      const linkedMetricIds = goalMetrics
        .filter(gm => gm.goal_id === goal.id)
        .map(gm => gm.metric_id);
      
      const relatedHabits = habits.filter(habit => {
        const impacts = relationships.filter(r => r.source_type === 'habit' && r.source_id === habit.id && r.target_type === 'metric');
        return impacts.some(r => linkedMetricIds.includes(r.target_id));
      });

      if (relatedHabits.length > 0) {
        groups[`goal-${goal.id}`] = relatedHabits;
      }
    });

    // 2. Regular categories
    habits.forEach(habit => {
      // If it's already in a goal group, we might still want it in its category
      // But for a clean list, let's prioritize goal groups if they exist?
      // Actually, let's just group everything by category and show goal groups separately if requested.
      // Re-reading: "categorized by groups and sub-groups, with multi-metric goals having their own categories"
      // This suggests goals ARE categories.
      
      if (habit.category_id) {
        if (!groups[habit.category_id]) groups[habit.category_id] = [];
        groups[habit.category_id].push(habit);
      } else {
        // Check if it's already in a goal group
        const isInGoalGroup = multiMetricGoals.some(goal => groups[`goal-${goal.id}`]?.some(h => h.id === habit.id));
        if (!isInGoalGroup) {
          groups.unassigned.push(habit);
        }
      }
    });

    return groups;
  }, [habits, multiMetricGoals, goalMetrics, relationships]);

  const renderHabitCard = (habit: Habit) => {
    const isCompleted = todayLogs.some(log => log.habit_id === habit.id);
    const relatedRels = relationships.filter(r => r.source_type === 'habit' && r.source_id === habit.id);
    const { current, longest } = calculateStreak(habit.id, habitLogs);
    
    return (
      <div key={habit.id} className="bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-5 hover:border-zinc-700 transition-all flex flex-col shadow-sm group relative">
        <button 
          onClick={() => deleteHabit(habit.id)}
          className="absolute top-2 right-2 p-1.5 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
          title="Delete Habit"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-base font-semibold text-white group-hover:text-blue-400 transition-colors">{habit.name}</h3>
            <div className="flex items-center text-zinc-500 text-xs mt-1 font-medium">
              <Calendar className="w-3.5 h-3.5 mr-1" />
              {habit.frequency}
            </div>
          </div>
          <button
            onClick={() => !isCompleted && logHabit(habit.id, userId)}
            disabled={isCompleted}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              isCompleted 
                ? 'bg-blue-500/20 text-blue-500 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                : 'bg-zinc-800/80 text-zinc-500 hover:bg-zinc-700 hover:text-white border border-zinc-700'
            }`}
          >
            <CheckCircle className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex gap-3 mb-4">
          <div className="flex items-center text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded-md text-xs">
            <Flame className="w-3.5 h-3.5 mr-1" />
            <span className="font-bold">{current}</span>
          </div>
          <div className="flex items-center text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-md text-xs">
            <Trophy className="w-3.5 h-3.5 mr-1" />
            <span className="font-bold">{longest}</span>
          </div>
        </div>
        
        <div className="mt-auto pt-3 border-t border-zinc-800/40">
          <div className="flex flex-wrap gap-1.5">
            {relatedRels.length > 0 ? relatedRels.map(rel => {
              const metric = metrics.find(m => m.id === rel.target_id);
              if (!metric) return null;
              return (
                <span key={rel.id} className="inline-flex items-center px-2 py-0.5 rounded bg-zinc-800/30 border border-zinc-700/30 text-[10px] font-bold text-zinc-400 uppercase tracking-tight">
                  {metric.name} <span className="text-emerald-500 ml-1">+{rel.weight}</span>
                </span>
              );
            }) : (
              <span className="text-[10px] text-zinc-600 italic">No linked metrics</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCategory = (category: Category, level = 0) => {
    const habitsInCategory = groupedHabits[category.id] || [];
    const subCategories = categories.filter(c => c.parent_id === category.id);
    const isExpanded = expandedCategories[category.id] !== false; // Default expanded

    if (habitsInCategory.length === 0 && subCategories.length === 0) return null;

    return (
      <div key={category.id} className={`space-y-4 ${level > 0 ? 'ml-6 border-l border-zinc-800 pl-6' : ''}`}>
        <button 
          onClick={() => toggleCategory(category.id)}
          className="flex items-center group w-full text-left"
        >
          <div className={`p-1.5 rounded-lg mr-3 transition-colors ${isExpanded ? 'bg-blue-500/10 text-blue-400' : 'bg-zinc-800 text-zinc-500'}`}>
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
          <Folder className={`w-4 h-4 mr-2 ${isExpanded ? 'text-blue-400' : 'text-zinc-500'}`} />
          <h2 className={`text-lg font-bold tracking-tight transition-colors ${isExpanded ? 'text-white' : 'text-zinc-500'}`}>
            {category.name}
            <span className="ml-2 text-xs font-medium text-zinc-600 bg-zinc-800/50 px-2 py-0.5 rounded-full">
              {habitsInCategory.length}
            </span>
          </h2>
        </button>

        {isExpanded && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {habitsInCategory.map(renderHabitCard)}
            </div>
            {subCategories.map(sub => renderCategory(sub, level + 1))}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">Habits</h1>
          <p className="text-zinc-500 mt-2 font-medium">The atomic units of your personal evolution.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleCategorizeAll}
            disabled={aiLoading || habits.length === 0}
            className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700 px-5 py-2.5 rounded-full font-bold flex items-center transition-all transform hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50"
          >
            {aiLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Folder className="w-5 h-5 mr-2" />}
            Categorize
          </button>
          <button 
            onClick={() => setIsBuildingWithAI(!isBuildingWithAI)}
            className="bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 px-5 py-2.5 rounded-full font-bold flex items-center transition-all transform hover:scale-105 active:scale-95 shadow-lg"
          >
            <Bot className="w-5 h-5 mr-2" />
            AI Build
          </button>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-white text-black hover:bg-zinc-200 px-5 py-2.5 rounded-full font-bold flex items-center transition-all transform hover:scale-105 active:scale-95 shadow-lg"
          >
            {isAdding ? <X className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
            {isAdding ? 'Cancel' : 'New Habit'}
          </button>
        </div>
      </header>

      {isBuildingWithAI && (
        <div className="bg-blue-950/20 border border-blue-500/20 rounded-2xl p-8 space-y-6 shadow-2xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center space-x-3 mb-2">
            <Bot className="w-6 h-6 text-blue-400" />
            <h3 className="text-2xl font-black text-white uppercase italic">AI Habit Architect</h3>
          </div>
          <p className="text-zinc-400 text-sm">Describe your lifestyle goals, and I'll architect a set of habits and metrics to get you there.</p>
          <div className="space-y-4">
            <textarea 
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium min-h-[100px]"
              placeholder="e.g. I want to improve my cardiovascular health and mental clarity. I have 30 minutes in the morning."
            />
            <div className="flex justify-end">
              <button 
                onClick={handleAIBuild}
                disabled={aiLoading || !aiPrompt}
                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-black uppercase italic tracking-wider transition-all shadow-lg shadow-blue-500/20 flex items-center disabled:opacity-50"
              >
                {aiLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Sparkles className="w-5 h-5 mr-2" />}
                Generate Habits
              </button>
            </div>
          </div>
        </div>
      )}

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-6 shadow-2xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-2 h-8 bg-blue-500 rounded-full" />
            <h3 className="text-2xl font-black text-white uppercase italic">Define New Action</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest">Habit Name</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={newHabit.name}
                  onChange={e => setNewHabit({...newHabit, name: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                  placeholder="e.g. 20min Meditation"
                />
                <button
                  type="button"
                  onClick={handleAiSuggest}
                  disabled={aiLoading || !newHabit.name}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-400 hover:text-blue-300 disabled:text-zinc-600 transition-colors"
                  title="AI Suggest Category"
                >
                  {aiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest">Frequency</label>
              <select 
                value={newHabit.frequency}
                onChange={e => setNewHabit({...newHabit, frequency: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium appearance-none"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="3x/week">3x / Week</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest">Category</label>
              <select 
                value={newHabit.category_id}
                onChange={e => setNewHabit({...newHabit, category_id: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium appearance-none"
              >
                <option value="">Unassigned</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {suggestedMetrics.length > 0 && (
            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest">AI Suggested Impacts</label>
              <div className="flex flex-wrap gap-2">
                {suggestedMetrics.map((m, i) => (
                  <span key={i} className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 text-xs font-bold uppercase tracking-wider flex items-center">
                    <Sparkles className="w-3 h-3 mr-1.5" />
                    {m}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-zinc-500 italic">These metrics will be automatically linked to this habit.</p>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-black uppercase italic tracking-wider transition-all shadow-lg shadow-blue-500/20 active:scale-95">
              Initialize Habit
            </button>
          </div>
        </form>
      )}

      <div className="space-y-12">
        {/* Multi-metric Goal Sections */}
        {multiMetricGoals.map(goal => {
          const habitsInGoal = groupedHabits[`goal-${goal.id}`] || [];
          if (habitsInGoal.length === 0) return null;
          const isExpanded = expandedCategories[`goal-${goal.id}`] !== false;

          return (
            <section key={goal.id} className="space-y-6">
              <button 
                onClick={() => toggleCategory(`goal-${goal.id}`)}
                className="flex items-center group w-full text-left"
              >
                <div className={`p-2 rounded-xl mr-4 transition-all ${isExpanded ? 'bg-amber-500 text-black rotate-0' : 'bg-zinc-800 text-zinc-500 rotate-90'}`}>
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white uppercase italic tracking-tight flex items-center">
                    {goal.name}
                    <span className="ml-3 text-[10px] font-black bg-amber-500 text-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                      Multi-Metric Goal
                    </span>
                  </h2>
                  <p className="text-zinc-500 text-xs font-medium mt-0.5">{goal.description}</p>
                </div>
                <div className="ml-auto">
                  {isExpanded ? <ChevronDown className="w-5 h-5 text-zinc-600" /> : <ChevronRight className="w-5 h-5 text-zinc-600" />}
                </div>
              </button>

              {isExpanded && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-left-2 duration-500">
                  {habitsInGoal.map(renderHabitCard)}
                </div>
              )}
            </section>
          );
        })}

        {/* Regular Category Sections */}
        {categories.filter(c => !c.parent_id).map(cat => renderCategory(cat))}

        {/* Unassigned Habits */}
        {groupedHabits.unassigned.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center">
              <div className="p-2 bg-zinc-800 text-zinc-500 rounded-xl mr-4">
                <Folder className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-black text-zinc-500 uppercase italic tracking-tight">Uncategorized</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupedHabits.unassigned.map(renderHabitCard)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

