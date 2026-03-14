import { useEffect, useState } from 'react';
import { useLifeGraphStore } from '../store/useLifeGraphStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle, TrendingUp, Zap, Target, Lightbulb, AlertTriangle, Bot, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { aiCoachService } from '../services/aiCoach';

export function Dashboard() {
  const { metrics, habits, goals, habitLogs, userStats, insights, seedData, logHabit, generateInsights } = useLifeGraphStore();
  const userId = 'user-1';
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);

  useEffect(() => {
    seedData(userId);
    generateInsights(userId);
  }, [seedData, generateInsights]);

  const today = new Date().toISOString().split('T')[0];
  const todayLogs = habitLogs.filter(log => log.completed_at.startsWith(today));

  const getQuickAdvice = async () => {
    setIsLoadingAdvice(true);
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentHabitLogs = habitLogs.filter(log => new Date(log.completed_at) >= sevenDaysAgo);
      const recentMetricLogs = useLifeGraphStore.getState().metricLogs.filter(log => new Date(log.recorded_at) >= sevenDaysAgo);

      const userData = {
        metrics: metrics.map(m => ({ name: m.name, value: m.current_value })),
        habits: habits.map(h => ({ name: h.name, frequency: h.frequency })),
        goals: goals.map(g => ({ name: g.name, target: 'Multi-metric' })),
        recentHabitLogs: recentHabitLogs.map(l => ({ habitId: l.habit_id, date: l.completed_at })),
        recentMetricLogs: recentMetricLogs.map(l => ({ metricId: l.metric_id, value: l.value, date: l.recorded_at }))
      };
      const response = await aiCoachService.sendMessage([
        { role: 'user', content: 'Give me a 2-sentence quick advice based on my current stats.' }
      ], userData);
      setAiAdvice(response);
    } catch (error) {
      setAiAdvice("Unable to fetch advice at the moment.");
    } finally {
      setIsLoadingAdvice(false);
    }
  };

  // Compute progression data for charts
  const progressionData = (() => {
    const days = 5;
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      const dayData: any = { name: dayName };
      
      // Find the latest log for each tracked metric on or before this day
      // For simplicity, we just look for logs exactly on this day, or carry over previous
      metrics.forEach(m => {
        if (['Focus', 'Energy', 'Strength'].includes(m.name)) {
          const log = useLifeGraphStore.getState().metricLogs
            .filter(l => l.metric_id === m.id && l.recorded_at.startsWith(dateStr))
            .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())[0];
          
          if (log) {
            dayData[m.name] = log.value;
          } else {
            // If no log today, try to find the most recent one before today
            const pastLog = useLifeGraphStore.getState().metricLogs
              .filter(l => l.metric_id === m.id && new Date(l.recorded_at) < d)
              .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())[0];
            dayData[m.name] = pastLog ? pastLog.value : 0;
          }
        }
      });
      data.push(dayData);
    }
    return data;
  })();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
        <p className="text-zinc-400 mt-1">Overview of your personal development.</p>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 flex flex-col">
          <div className="flex items-center text-emerald-500 mb-4">
            <Zap className="w-5 h-5 mr-2" />
            <h3 className="font-medium">Level {userStats?.level || 1}</h3>
          </div>
          <div className="mt-auto">
            <div className="text-3xl font-bold text-white mb-1">{userStats?.xp || 0} XP</div>
            <div className="w-full bg-zinc-800 rounded-full h-1.5">
              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${((userStats?.xp || 0) % 100)}%` }}></div>
            </div>
            <p className="text-xs text-zinc-500 mt-2">100 XP to next level</p>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 flex flex-col">
          <div className="flex items-center text-blue-500 mb-4">
            <TrendingUp className="w-5 h-5 mr-2" />
            <h3 className="font-medium">Top Metric</h3>
          </div>
          <div className="mt-auto">
            <div className="text-3xl font-bold text-white mb-1">
              {metrics.sort((a, b) => b.current_value - a.current_value)[0]?.name || 'N/A'}
            </div>
            <p className="text-sm text-zinc-400">
              Level {metrics.sort((a, b) => b.current_value - a.current_value)[0]?.current_value.toFixed(1) || 0}
            </p>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 flex flex-col">
          <div className="flex items-center text-purple-500 mb-4">
            <CheckCircle className="w-5 h-5 mr-2" />
            <h3 className="font-medium">Habits Today</h3>
          </div>
          <div className="mt-auto">
            <div className="text-3xl font-bold text-white mb-1">{todayLogs.length} / {habits.length}</div>
            <p className="text-sm text-zinc-400">Completed</p>
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 flex flex-col">
          <div className="flex items-center text-amber-500 mb-4">
            <Target className="w-5 h-5 mr-2" />
            <h3 className="font-medium">Active Goals</h3>
          </div>
          <div className="mt-auto">
            <div className="text-3xl font-bold text-white mb-1">{goals.length}</div>
            <p className="text-sm text-zinc-400">In progress</p>
          </div>
        </div>
      </div>

      {/* Insights Section */}
      {insights && insights.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <Lightbulb className="w-5 h-5 mr-2 text-amber-400" />
            Insights Engine
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map(insight => (
              <div key={insight.id} className={`bg-zinc-900/50 border rounded-xl p-4 flex items-start ${
                insight.type === 'warning' ? 'border-rose-500/30' : 
                insight.type === 'correlation' ? 'border-indigo-500/30' : 'border-emerald-500/30'
              }`}>
                <div className={`p-2 rounded-full mr-3 flex-shrink-0 ${
                  insight.type === 'warning' ? 'bg-rose-500/20 text-rose-400' : 
                  insight.type === 'correlation' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {insight.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> : <Lightbulb className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-sm text-zinc-300">{insight.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Coach Quick Panel */}
      <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start">
            <div className="p-3 bg-indigo-500/20 rounded-xl mr-4">
              <Bot className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">AI Performance Coach</h2>
              {aiAdvice ? (
                <p className="text-zinc-300 text-sm max-w-2xl">{aiAdvice}</p>
              ) : (
                <p className="text-zinc-400 text-sm max-w-2xl">
                  Get personalized insights and actionable advice based on your latest metrics and habits.
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {!aiAdvice && (
              <button 
                onClick={getQuickAdvice}
                disabled={isLoadingAdvice}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
              >
                {isLoadingAdvice ? 'Analyzing...' : 'Get Quick Advice'}
              </button>
            )}
            <Link 
              to="/ai-coach" 
              className="flex items-center px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-sm font-medium text-white transition-colors"
            >
              Open Chat <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Daily Habits */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-zinc-400" />
            Daily Habits
          </h2>
          <div className="space-y-3">
            {habits.map(habit => {
              const isCompleted = todayLogs.some(log => log.habit_id === habit.id);
              return (
                <div key={habit.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-white">{habit.name}</h4>
                    <p className="text-xs text-zinc-500">{habit.frequency}</p>
                  </div>
                  <button
                    onClick={() => !isCompleted && logHabit(habit.id, userId)}
                    disabled={isCompleted}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      isCompleted 
                        ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' 
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white border border-zinc-700'
                    }`}
                  >
                    <CheckCircle className="w-5 h-5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Progression Chart */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-zinc-400" />
            Stat Progression
          </h2>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#52525b" tick={{fill: '#a1a1aa', fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis stroke="#52525b" tick={{fill: '#a1a1aa', fontSize: 12}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5', borderRadius: '8px' }}
                  itemStyle={{ color: '#f4f4f5' }}
                />
                <Line type="monotone" dataKey="Focus" stroke="#10b981" strokeWidth={2} dot={{r: 4, fill: '#10b981', strokeWidth: 0}} activeDot={{r: 6}} />
                <Line type="monotone" dataKey="Energy" stroke="#3b82f6" strokeWidth={2} dot={{r: 4, fill: '#3b82f6', strokeWidth: 0}} activeDot={{r: 6}} />
                <Line type="monotone" dataKey="Strength" stroke="#8b5cf6" strokeWidth={2} dot={{r: 4, fill: '#8b5cf6', strokeWidth: 0}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
