import React, { useState } from 'react';
import { useLifeGraphStore } from '../store/useLifeGraphStore';
import { Bot, Sparkles, X } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { parseGoalWithAI } from '../services/aiService';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export function AIPanel({ onClose }: { onClose: () => void }) {
  const { metrics, habits, goals, goalMetrics, resources, notes, relationships, addGoal, addMetric, addGoalMetric, addHabit, addResource } = useLifeGraphStore();
  const [suggestion, setSuggestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'analyze' | 'build'>('analyze');
  const [goalPrompt, setGoalPrompt] = useState('');

  const analyzeGraph = async () => {
    setLoading(true);
    try {
      const prompt = `Analyze this graph data and provide:
        1. Suggestions for improvement.
        2. Identify missing connections (e.g., 'Your focus goal is missing the sleep metric').
        3. Recommend relevant habits or resources.

        Data:
        Metrics: ${JSON.stringify(metrics.map(m => ({ id: m.id, name: m.name, category_id: m.category_id })))}
        Habits: ${JSON.stringify(habits.map(h => ({ id: h.id, name: h.name })))}
        Goals: ${JSON.stringify(goals.map(g => ({ id: g.id, name: g.name, description: g.description })))}
        GoalMetrics: ${JSON.stringify(goalMetrics.map(gm => ({ goal_id: gm.goal_id, metric_id: gm.metric_id })))}
        Resources: ${JSON.stringify(resources.map(r => ({ id: r.id, title: r.title, type: r.type })))}
        Notes: ${JSON.stringify(notes.map(n => ({ id: n.id, content: n.content })))}
        Relationships: ${JSON.stringify(relationships.map(r => ({ source_id: r.source_id, target_id: r.target_id, source_type: r.source_type, target_type: r.target_type })))}
      `;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt
      });
      
      setSuggestion(response.text || 'No suggestions available.');
    } catch (error) {
      console.error('AI Analysis error:', error);
      setSuggestion('Failed to analyze graph.');
    }
    setLoading(false);
  };

  const buildGraph = async () => {
    if (!goalPrompt) return;
    setLoading(true);
    try {
      const result = await parseGoalWithAI(goalPrompt);
      
      const userId = 'user-1';
      
      // Create Goal
      addGoal({
        user_id: userId,
        name: result.goalName,
        description: result.description,
        target_date: new Date().toISOString(),
        color: null,
        icon: null
      });
      
      result.metrics.forEach((m: any) => {
        addMetric({
          user_id: userId,
          name: m.name,
          category_id: null,
          measurement_type: 'numeric',
          data_source: 'manual',
          notes: null,
          current_value: 0,
          decay_rate: 0,
          formula: null,
          color: null,
          icon: null
        });
      });

      result.habits.forEach((h: string) => {
        addHabit({
          user_id: userId,
          name: h,
          frequency: 'daily',
          color: null,
          icon: null
        });
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

      setSuggestion('Graph built successfully!');
    } catch (error) {
      console.error('AI Build error:', error);
      setSuggestion('Failed to build graph.');
    }
    setLoading(false);
  };

  return (
    <div className="w-80 bg-zinc-900 border-l border-zinc-800 p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-white flex items-center">
          <Bot className="w-5 h-5 mr-2 text-emerald-500" />
          AI Assistant
        </h2>
        <button onClick={onClose} className="text-zinc-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex bg-zinc-800 rounded-lg p-1 mb-4">
        <button onClick={() => setMode('analyze')} className={`flex-1 py-1 text-sm rounded ${mode === 'analyze' ? 'bg-zinc-700 text-white' : 'text-zinc-400'}`}>Analyze</button>
        <button onClick={() => setMode('build')} className={`flex-1 py-1 text-sm rounded ${mode === 'build' ? 'bg-zinc-700 text-white' : 'text-zinc-400'}`}>Build Goal</button>
      </div>

      {mode === 'analyze' ? (
        <button 
          onClick={analyzeGraph}
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center transition-colors mb-4"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {loading ? 'Analyzing...' : 'Analyze Graph'}
        </button>
      ) : (
        <div className="space-y-4 mb-4">
          <textarea 
            value={goalPrompt}
            onChange={e => setGoalPrompt(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="e.g. I want to run a marathon in 12 months."
            rows={3}
          />
          <button 
            onClick={buildGraph}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center transition-colors"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {loading ? 'Building...' : 'Build Graph'}
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto text-zinc-300 text-sm">
        {suggestion}
      </div>
    </div>
  );
}
