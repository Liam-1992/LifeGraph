import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Category, Metric, Habit, Goal, Resource, Note, Relationship, HabitLog, MetricLog, JournalEntry, Insight, UserStats } from '../types';

interface LifeGraphState {
  categories: Category[];
  metrics: Metric[];
  habits: Habit[];
  goals: Goal[];
  resources: Resource[];
  notes: Note[];
  relationships: Relationship[];
  habitLogs: HabitLog[];
  metricLogs: MetricLog[];
  journalEntries: JournalEntry[];
  insights: Insight[];
  userStats: UserStats | null;
  
  // Actions
  addCategory: (category: Omit<Category, 'id' | 'created_at'>) => void;
  addMetric: (metric: Omit<Metric, 'id' | 'created_at'>) => void;
  updateMetric: (id: string, data: Partial<Metric>) => void;
  addHabit: (habit: Omit<Habit, 'id' | 'created_at'>) => void;
  addGoal: (goal: Omit<Goal, 'id' | 'created_at'>) => void;
  addResource: (resource: Omit<Resource, 'id' | 'created_at'>) => void;
  addNote: (note: Omit<Note, 'id' | 'created_at' | 'updated_at'>) => void;
  addRelationship: (rel: Omit<Relationship, 'id' | 'created_at'>) => void;
  updateRelationship: (id: string, data: Partial<Relationship>) => void;
  logHabit: (habitId: string, userId: string) => void;
  logMetric: (metricId: string, value: number, userId: string) => void;
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'created_at'>) => void;
  
  // Logic
  applyDecay: () => void;
  generateInsights: (userId: string) => void;
  
  // Initialize with seed data
  seedData: (userId: string) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useLifeGraphStore = create<LifeGraphState>()(
  persist(
    (set, get) => ({
      categories: [],
      metrics: [],
      habits: [],
      goals: [],
      resources: [],
      notes: [],
      relationships: [],
      habitLogs: [],
      metricLogs: [],
      journalEntries: [],
      insights: [],
      userStats: null,

      addCategory: (category) => set((state) => ({
        categories: [...state.categories, { ...category, id: generateId(), created_at: new Date().toISOString() }]
      })),

      addMetric: (metric) => set((state) => ({
        metrics: [...state.metrics, { ...metric, id: generateId(), created_at: new Date().toISOString() }]
      })),

      updateMetric: (id, data) => set((state) => ({
        metrics: state.metrics.map((m) => m.id === id ? { ...m, ...data } : m)
      })),

      addHabit: (habit) => set((state) => ({
        habits: [...state.habits, { ...habit, id: generateId(), created_at: new Date().toISOString() }]
      })),

      addGoal: (goal) => set((state) => ({
        goals: [...state.goals, { ...goal, id: generateId(), created_at: new Date().toISOString() }]
      })),

      addResource: (resource) => set((state) => ({
        resources: [...state.resources, { ...resource, id: generateId(), created_at: new Date().toISOString() }]
      })),

      addNote: (note) => set((state) => ({
        notes: [...state.notes, { ...note, id: generateId(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }]
      })),

      addRelationship: (rel) => set((state) => ({
        relationships: [...state.relationships, { ...rel, id: generateId(), created_at: new Date().toISOString() }]
      })),

      updateRelationship: (id, data) => set((state) => ({
        relationships: state.relationships.map((r) => r.id === id ? { ...r, ...data } : r)
      })),

      logHabit: (habitId, userId) => {
        const { habits, relationships, metrics, updateMetric, userStats } = get();
        const habit = habits.find(h => h.id === habitId);
        if (!habit) return;

        const newLog: HabitLog = {
          id: generateId(),
          user_id: userId,
          habit_id: habitId,
          completed_at: new Date().toISOString()
        };

        // Find relationships where this habit is the source
        const relatedMetrics = relationships.filter(r => r.source_type === 'habit' && r.source_id === habitId && r.target_type === 'metric');
        
        // Update metrics based on relationships (ignoring delay for immediate feedback in this mock)
        relatedMetrics.forEach(rel => {
          const metric = metrics.find(m => m.id === rel.target_id);
          if (metric) {
            updateMetric(metric.id, { current_value: metric.current_value + rel.weight });
            
            // Also add a metric log
            set((state) => ({
              metricLogs: [...state.metricLogs, {
                id: generateId(),
                user_id: userId,
                metric_id: metric.id,
                value: metric.current_value + rel.weight,
                recorded_at: new Date().toISOString()
              }]
            }));
          }
        });

        // Grant XP
        const currentXp = userStats?.xp || 0;
        const currentLevel = userStats?.level || 1;
        const newXp = currentXp + 10;
        const newLevel = Math.floor(newXp / 100) + 1;

        set((state) => ({
          habitLogs: [...state.habitLogs, newLog],
          userStats: {
            user_id: userId,
            xp: newXp,
            level: newLevel,
            created_at: state.userStats?.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }));
      },

      logMetric: (metricId, value, userId) => set((state) => {
        const metric = state.metrics.find(m => m.id === metricId);
        if (!metric) return state;

        return {
          metrics: state.metrics.map(m => m.id === metricId ? { ...m, current_value: value } : m),
          metricLogs: [...state.metricLogs, {
            id: generateId(),
            user_id: userId,
            metric_id: metricId,
            value,
            recorded_at: new Date().toISOString()
          }]
        };
      }),

      addJournalEntry: (entry) => set((state) => ({
        journalEntries: [...state.journalEntries, { ...entry, id: generateId(), created_at: new Date().toISOString() }]
      })),

      applyDecay: () => set((state) => {
        const updatedMetrics = state.metrics.map(m => {
          if (m.decay_rate > 0) {
            return { ...m, current_value: Math.max(0, m.current_value - m.decay_rate) };
          }
          return m;
        });
        return { metrics: updatedMetrics };
      }),

      generateInsights: (userId) => set((state) => {
        // Mock insight generation based on data
        const newInsights: Insight[] = [];
        
        if (state.habitLogs.length > 5 && !state.insights.some(i => i.content.includes('meditation'))) {
          newInsights.push({
            id: generateId(),
            user_id: userId,
            content: "Consistent meditation correlates with +12% focus over the last week.",
            type: 'correlation',
            created_at: new Date().toISOString()
          });
        }

        if (state.metrics.some(m => m.name === 'Strength' && m.current_value < 4) && !state.insights.some(i => i.content.includes('Strength'))) {
          newInsights.push({
            id: generateId(),
            user_id: userId,
            content: "Strength metric is decaying. Consider scheduling a workout.",
            type: 'warning',
            created_at: new Date().toISOString()
          });
        }

        return { insights: [...state.insights, ...newInsights] };
      }),

      seedData: (userId) => {
        const state = get();
        if (state.metrics.length > 0) return; // Already seeded

        const cPhysicalId = generateId();
        const cCognitiveId = generateId();
        const cBiohackingId = generateId();

        const mFocusId = generateId();
        const mEnergyId = generateId();
        const mStrengthId = generateId();
        const mEnduranceId = generateId();
        const mProductivityId = generateId();

        const hMeditationId = generateId();
        const hRunningId = generateId();
        const hSleepId = generateId();

        const rDeepWorkId = generateId();
        const nSleepNoteId = generateId();

        set({
          userStats: { user_id: userId, xp: 120, level: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          categories: [
            { id: cPhysicalId, user_id: userId, name: 'Physical', parent_id: null, framework: null, created_at: new Date().toISOString() },
            { id: cCognitiveId, user_id: userId, name: 'Cognitive', parent_id: null, framework: null, created_at: new Date().toISOString() },
            { id: cBiohackingId, user_id: userId, name: 'Biohacking', parent_id: null, framework: 'Huberman Protocol', created_at: new Date().toISOString() },
          ],
          metrics: [
            { id: mFocusId, user_id: userId, name: 'Focus', category_id: cCognitiveId, measurement_type: 'rating', data_source: 'manual', notes: 'Ability to maintain attention', current_value: 7, decay_rate: 0.1, formula: null, created_at: new Date().toISOString() },
            { id: mEnergyId, user_id: userId, name: 'Energy', category_id: cPhysicalId, measurement_type: 'rating', data_source: 'manual', notes: 'Daily energy levels', current_value: 8, decay_rate: 0.2, formula: null, created_at: new Date().toISOString() },
            { id: mStrengthId, user_id: userId, name: 'Strength', category_id: cPhysicalId, measurement_type: 'numeric', data_source: 'gym_log', notes: '1RM average', current_value: 5, decay_rate: 0.05, formula: null, created_at: new Date().toISOString() },
            { id: mEnduranceId, user_id: userId, name: 'Endurance', category_id: cPhysicalId, measurement_type: 'numeric', data_source: 'strava', notes: 'Weekly mileage', current_value: 6, decay_rate: 0.1, formula: null, created_at: new Date().toISOString() },
            { id: mProductivityId, user_id: userId, name: 'Productivity', category_id: cCognitiveId, measurement_type: 'derived', data_source: 'system', notes: 'Derived from Focus and Energy', current_value: 7.5, decay_rate: 0, formula: '(Focus + Energy) / 2', created_at: new Date().toISOString() },
          ],
          habits: [
            { id: hMeditationId, user_id: userId, name: 'Meditation', frequency: 'daily', created_at: new Date().toISOString() },
            { id: hRunningId, user_id: userId, name: 'Running', frequency: '3x/week', created_at: new Date().toISOString() },
            { id: hSleepId, user_id: userId, name: '8 Hours Sleep', frequency: 'daily', created_at: new Date().toISOString() },
          ],
          resources: [
            { id: rDeepWorkId, user_id: userId, title: 'Deep Work', url: 'https://calnewport.com', description: 'Rules for focused success', type: 'book', tags: ['focus', 'productivity'], created_at: new Date().toISOString() }
          ],
          notes: [
            { id: nSleepNoteId, user_id: userId, content: 'Sleep quality strongly affects focus the next day. Need to ensure room is cold.', tags: ['sleep', 'focus'], created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
          ],
          relationships: [
            { id: generateId(), user_id: userId, source_type: 'habit', source_id: hMeditationId, target_type: 'metric', target_id: mFocusId, weight: 0.6, delay_days: 0, created_at: new Date().toISOString() },
            { id: generateId(), user_id: userId, source_type: 'habit', source_id: hRunningId, target_type: 'metric', target_id: mEnduranceId, weight: 0.8, delay_days: 1, created_at: new Date().toISOString() },
            { id: generateId(), user_id: userId, source_type: 'habit', source_id: hSleepId, target_type: 'metric', target_id: mEnergyId, weight: 0.7, delay_days: 1, created_at: new Date().toISOString() },
            { id: generateId(), user_id: userId, source_type: 'metric', source_id: mFocusId, target_type: 'metric', target_id: mProductivityId, weight: 0.5, delay_days: 0, created_at: new Date().toISOString() },
            { id: generateId(), user_id: userId, source_type: 'metric', source_id: mEnergyId, target_type: 'metric', target_id: mProductivityId, weight: 0.5, delay_days: 0, created_at: new Date().toISOString() },
            { id: generateId(), user_id: userId, source_type: 'resource', source_id: rDeepWorkId, target_type: 'metric', target_id: mFocusId, weight: 0.2, delay_days: 0, created_at: new Date().toISOString() },
            { id: generateId(), user_id: userId, source_type: 'note', source_id: nSleepNoteId, target_type: 'habit', target_id: hSleepId, weight: 0, delay_days: 0, created_at: new Date().toISOString() },
          ],
          goals: [
            { id: generateId(), user_id: userId, name: 'Laser Focus', description: 'Reach Focus level 10', target_metric_id: mFocusId, target_value: 10, created_at: new Date().toISOString() }
          ],
          metricLogs: [
            { id: generateId(), user_id: userId, metric_id: mFocusId, value: 6, recorded_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
            { id: generateId(), user_id: userId, metric_id: mEnergyId, value: 7, recorded_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
            { id: generateId(), user_id: userId, metric_id: mStrengthId, value: 5, recorded_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
            
            { id: generateId(), user_id: userId, metric_id: mFocusId, value: 6.5, recorded_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
            { id: generateId(), user_id: userId, metric_id: mEnergyId, value: 7.2, recorded_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
            { id: generateId(), user_id: userId, metric_id: mStrengthId, value: 5, recorded_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
            
            { id: generateId(), user_id: userId, metric_id: mFocusId, value: 6.8, recorded_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
            { id: generateId(), user_id: userId, metric_id: mEnergyId, value: 7.5, recorded_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
            { id: generateId(), user_id: userId, metric_id: mStrengthId, value: 5.2, recorded_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
            
            { id: generateId(), user_id: userId, metric_id: mFocusId, value: 7, recorded_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
            { id: generateId(), user_id: userId, metric_id: mEnergyId, value: 7.8, recorded_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
            { id: generateId(), user_id: userId, metric_id: mStrengthId, value: 5.2, recorded_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
            
            { id: generateId(), user_id: userId, metric_id: mFocusId, value: 7.2, recorded_at: new Date().toISOString() },
            { id: generateId(), user_id: userId, metric_id: mEnergyId, value: 8, recorded_at: new Date().toISOString() },
            { id: generateId(), user_id: userId, metric_id: mStrengthId, value: 5.5, recorded_at: new Date().toISOString() },
          ],
          insights: [
            { id: generateId(), user_id: userId, content: "Sleep above 7 hours correlates with +15% focus.", type: 'correlation', created_at: new Date().toISOString() },
            { id: generateId(), user_id: userId, content: "Exercise improves energy on the following day.", type: 'correlation', created_at: new Date().toISOString() }
          ]
        });
      }
    }),
    {
      name: 'lifegraph-os-storage',
    }
  )
);

