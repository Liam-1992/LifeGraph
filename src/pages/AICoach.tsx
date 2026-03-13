import { useState, useRef, useEffect } from 'react';
import { useLifeGraphStore } from '../store/useLifeGraphStore';
import { aiCoachService, AIChatMessage } from '../services/aiCoach';
import { Send, Bot, User, Loader2, Sparkles, Brain, Zap, Target } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export function AICoach() {
  const { metrics, habits, goals, habitLogs } = useLifeGraphStore();
  const [messages, setMessages] = useState<AIChatMessage[]>([
    { role: 'assistant', content: "Hello! I'm your LifeGraph AI Coach. How can I help you optimize your performance today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;

    const userMessage: AIChatMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentHabitLogs = habitLogs.filter(log => new Date(log.completed_at) >= sevenDaysAgo);
      const recentMetricLogs = useLifeGraphStore.getState().metricLogs.filter(log => new Date(log.recorded_at) >= sevenDaysAgo);

      const userData = {
        metrics: metrics.map(m => ({ name: m.name, value: m.current_value })),
        habits: habits.map(h => ({ name: h.name, frequency: h.frequency })),
        goals: goals.map(g => ({ name: g.name, target: g.target_value })),
        recentHabitLogs: recentHabitLogs.map(l => ({ habitId: l.habit_id, date: l.completed_at })),
        recentMetricLogs: recentMetricLogs.map(l => ({ metricId: l.metric_id, value: l.value, date: l.recorded_at }))
      };

      const response = await aiCoachService.sendMessage([...messages, userMessage], userData);
      
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${error.message || 'Failed to connect to AI Coach.'}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { label: "Analyze my metrics", icon: Brain, prompt: "Can you analyze my current metrics and tell me what's going well and what needs improvement?" },
    { label: "Suggest new habits", icon: Sparkles, prompt: "Based on my goals and metrics, what new habits should I consider adding to my routine?" },
    { label: "Why is my energy low?", icon: Zap, prompt: "My energy feels low lately. Can you look at my data and suggest why, and how to fix it?" },
    { label: "How to hit my goals?", icon: Target, prompt: "What is the most effective way for me to reach my current active goals?" }
  ];

  return (
    <div className="h-full flex flex-col space-y-4 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center">
          <Bot className="w-8 h-8 mr-3 text-indigo-500" />
          AI Coach
        </h1>
        <p className="text-zinc-400 mt-1">Your personal performance optimization assistant.</p>
      </header>

      <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  msg.role === 'user' ? 'bg-emerald-500/20 text-emerald-500 ml-3' : 'bg-indigo-500/20 text-indigo-500 mr-3'
                }`}>
                  {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                <div className={`p-4 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-zinc-100' 
                    : 'bg-zinc-800/50 border border-zinc-700/50 text-zinc-300'
                }`}>
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex max-w-[80%] flex-row">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-500 mr-3 flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="p-4 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 text-zinc-300 flex items-center">
                  <Loader2 className="w-5 h-5 animate-spin mr-2 text-indigo-500" />
                  Thinking...
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {messages.length === 1 && (
          <div className="px-6 pb-4">
            <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider font-semibold">Suggested Questions</p>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(action.prompt)}
                  className="flex items-center px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors"
                >
                  <action.icon className="w-4 h-4 mr-2 text-indigo-400" />
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-center relative"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your AI coach anything..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-4 pr-12 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 p-2 text-zinc-400 hover:text-indigo-400 disabled:opacity-50 disabled:hover:text-zinc-400 transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
