# LifeGraph

LifeGraph is a self-improvement system where users can map their personal development like a skill tree or RPG stat sheet.

## Core Concept
Habits influence metrics, metrics influence higher-level attributes, and everything can be visualized as a graph.

## Tech Stack
- **Frontend**: React, Vite, React Router, Tailwind CSS
- **Visualization**: React Flow (for node graph visualization)
- **Charts**: Recharts
- **State Management**: Zustand (with local storage persistence for immediate preview)
- **Backend (Optional)**: Supabase (auth + database)

## Features
- **Dashboard**: Overview of your stats, daily habits, and progression charts.
- **Metrics**: Track your personal development stats across categories (Physical, Cognitive, Social).
- **Habits**: Actions that drive your metrics. Link habits to metrics with weighted impacts.
- **Goals**: Set targets for your metrics and track progress.
- **Graph**: Visualize how your habits influence your metrics and goals in an interactive node network.
- **RPG Elements**: Earn XP and level up by completing habits.

## Setup Instructions
1. The application is ready to run in the AI Studio environment.
2. It uses a local mock store (`zustand` with `localStorage`) so you can preview the functionality immediately.
3. To use Supabase, follow the instructions in `SUPABASE_SETUP.md`.

## File Structure
- `/src/components`: Reusable UI components (Layout).
- `/src/pages`: Main application pages (Dashboard, Metrics, Habits, Goals, Graph, Login).
- `/src/store`: Zustand state management (`useLifeGraphStore.ts`).
- `/src/types`: TypeScript definitions.
- `/src/lib`: Utility functions and Supabase client.
- `/supabase-schema.sql`: Database schema for Supabase.
