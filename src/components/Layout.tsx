import { Outlet, Link, useLocation } from 'react-router-dom';
import { Activity, BarChart2, CheckCircle, Network, Target, User, BookOpen, FileText, Book, Bot, Folder } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: Activity },
  { name: 'AI Coach', href: '/ai-coach', icon: Bot },
  { name: 'Metrics', href: '/metrics', icon: BarChart2 },
  { name: 'Categories', href: '/categories', icon: Folder },
  { name: 'Habits', href: '/habits', icon: CheckCircle },
  { name: 'Goals', href: '/goals', icon: Target },
  { name: 'Resources', href: '/resources', icon: BookOpen },
  { name: 'Notes', href: '/notes', icon: FileText },
  { name: 'Journal', href: '/journal', icon: Book },
  { name: 'Graph', href: '/graph', icon: Network },
];

export function Layout() {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-50 font-sans">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 border-r border-zinc-800 bg-zinc-900/50 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-zinc-800">
          <Network className="w-6 h-6 text-emerald-500 mr-3" />
          <span className="text-lg font-bold tracking-tight">LifeGraph OS</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  isActive ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white',
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors'
                )}
              >
                <item.icon
                  className={cn(
                    isActive ? 'text-emerald-500' : 'text-zinc-500 group-hover:text-emerald-400',
                    'flex-shrink-0 -ml-1 mr-3 h-5 w-5 transition-colors'
                  )}
                  aria-hidden="true"
                />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                <User className="w-4 h-4 text-zinc-400" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">User</p>
              <p className="text-xs font-medium text-zinc-500 group-hover:text-zinc-400">Level 2</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-zinc-950 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
