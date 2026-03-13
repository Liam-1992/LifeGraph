import React, { useState } from 'react';
import { useLifeGraphStore } from '../store/useLifeGraphStore';
import { Book, Plus, Tag, Calendar, Clock, Smile, Frown, Meh } from 'lucide-react';
import { format } from 'date-fns';

export function Journal() {
  const { journalEntries, addJournalEntry } = useLifeGraphStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newEntry, setNewEntry] = useState({ content: '', mood: 3, tags: '' });

  const userId = 'user-1';

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.content) return;
    
    addJournalEntry({
      user_id: userId,
      content: newEntry.content,
      date: new Date().toISOString(),
    });
    
    setNewEntry({ content: '', mood: 3, tags: '' });
    setIsAdding(false);
  };

  const getMoodIcon = (mood: number) => {
    if (mood >= 4) return <Smile className="w-5 h-5 text-emerald-400" />;
    if (mood <= 2) return <Frown className="w-5 h-5 text-rose-400" />;
    return <Meh className="w-5 h-5 text-amber-400" />;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Journal</h1>
          <p className="text-zinc-400 mt-1">Daily reflections and mood tracking.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Entry
        </button>
      </header>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-medium text-white">New Journal Entry</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Mood (1-5)</label>
              <div className="flex items-center space-x-4">
                {[1, 2, 3, 4, 5].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setNewEntry({...newEntry, mood: m})}
                    className={`p-2 rounded-full transition-colors ${
                      newEntry.mood === m 
                        ? 'bg-amber-500/20 ring-2 ring-amber-500' 
                        : 'bg-zinc-800 hover:bg-zinc-700'
                    }`}
                  >
                    {getMoodIcon(m)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Content</label>
              <textarea 
                value={newEntry.content}
                onChange={e => setNewEntry({...newEntry, content: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[150px]"
                placeholder="How was your day?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Tags (comma separated)</label>
              <input 
                type="text" 
                value={newEntry.tags}
                onChange={e => setNewEntry({...newEntry, tags: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="gratitude, reflection"
              />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button type="submit" className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
              Save Entry
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4 max-w-3xl mx-auto">
        {journalEntries.map(entry => (
          <div key={entry.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-zinc-800 rounded-full">
                  <Book className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center text-sm font-medium text-zinc-300">
                    <Calendar className="w-4 h-4 mr-1.5 text-zinc-500" />
                    {format(new Date(entry.created_at), 'MMMM d, yyyy')}
                  </div>
                  <div className="flex items-center text-xs text-zinc-500 mt-0.5">
                    <Clock className="w-3 h-3 mr-1.5" />
                    {format(new Date(entry.created_at), 'h:mm a')}
                  </div>
                </div>
              </div>
              
              {/* Tags removed as they are not in the type */}
            </div>
            
            <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed">{entry.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
