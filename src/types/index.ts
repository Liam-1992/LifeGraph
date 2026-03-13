export type Category = {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  framework: string | null;
  created_at: string;
};

export type Metric = {
  id: string;
  user_id: string;
  name: string;
  category_id: string | null;
  measurement_type: 'numeric' | 'rating' | 'binary' | 'percentage' | 'derived' | 'manual';
  data_source: string | null;
  notes: string | null;
  current_value: number;
  decay_rate: number;
  formula: string | null;
  created_at: string;
};

export type Habit = {
  id: string;
  user_id: string;
  name: string;
  frequency: string;
  created_at: string;
};

export type Goal = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  target_metric_id: string;
  target_value: number;
  created_at: string;
};

export type Resource = {
  id: string;
  user_id: string;
  title: string;
  url: string | null;
  description: string | null;
  type: 'book' | 'article' | 'video' | 'course' | 'tool' | 'paper';
  tags: string[];
  created_at: string;
};

export type Note = {
  id: string;
  user_id: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export type Relationship = {
  id: string;
  user_id: string;
  source_type: 'habit' | 'metric' | 'resource' | 'note' | 'goal';
  source_id: string;
  target_type: 'habit' | 'metric' | 'resource' | 'note' | 'goal';
  target_id: string;
  weight: number;
  delay_days: number;
  created_at: string;
};

export type HabitLog = {
  id: string;
  user_id: string;
  habit_id: string;
  completed_at: string;
};

export type MetricLog = {
  id: string;
  user_id: string;
  metric_id: string;
  value: number;
  recorded_at: string;
};

export type JournalEntry = {
  id: string;
  user_id: string;
  content: string;
  date: string;
  created_at: string;
};

export type Insight = {
  id: string;
  user_id: string;
  content: string;
  type: 'correlation' | 'suggestion' | 'warning' | 'achievement';
  created_at: string;
};

export type UserStats = {
  user_id: string;
  xp: number;
  level: number;
  created_at: string;
  updated_at: string;
};

