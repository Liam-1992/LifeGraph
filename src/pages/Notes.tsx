import React, { useState } from 'react';
import { useLifeGraphStore } from '../store/useLifeGraphStore';
import { FileText, Plus, Tag, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

export function Notes() {
  const { notes, addNote } = useLifeGraphStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '', tags: '' });

  const userId = 'user-1';

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.title || !newNote.content) return;
    
    addNote({
      user_id: userId,
      content: newNote.content,
      tags: newNote.tags.split(',').map(t => t.trim()).filter(Boolean)
    });
    
    setNewNote({ title: '', content: '', tags: '' });
    setIsAdding(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Notes</h1>
          <p className="text-zinc-400 mt-1">Capture ideas, reflections, and knowledge.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Note
        </button>
      </header>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-medium text-white">New Note</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Title</label>
              <input 
                type="text" 
                value={newNote.title}
                onChange={e => setNewNote({...newNote, title: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Note title..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Content</label>
              <textarea 
                value={newNote.content}
                onChange={e => setNewNote({...newNote, content: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[150px]"
                placeholder="Write your thoughts here..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Tags (comma separated)</label>
              <input 
                type="text" 
                value={newNote.tags}
                onChange={e => setNewNote({...newNote, tags: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="idea, reflection"
              />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <button type="submit" className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
              Save Note
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {notes.map(note => (
          <div key={note.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors flex flex-col">
            {/* Title removed */}
            <p className="text-sm text-zinc-400 mb-4 whitespace-pre-wrap flex-1">{note.content}</p>
            
            <div className="mt-auto space-y-4 pt-4 border-t border-zinc-800/50">
              {note.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {note.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-400">
                      <Tag className="w-3 h-3 mr-1" /> {tag}
                    </span>
                  ))}
                </div>
              )}
              
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {format(new Date(note.created_at), 'MMM d, yyyy')}
                </span>
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {format(new Date(note.created_at), 'h:mm a')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
