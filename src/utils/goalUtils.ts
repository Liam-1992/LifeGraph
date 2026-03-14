import { Goal, GoalMetric, Metric } from '../types';

export const calculateGoalProgress = (
  goal: Goal,
  goalMetrics: GoalMetric[],
  metrics: Metric[]
): number => {
  const relevantGoalMetrics = goalMetrics.filter(gm => gm.goal_id === goal.id);
  if (relevantGoalMetrics.length === 0) return 0;

  let totalProgress = 0;
  let totalWeight = 0;

  relevantGoalMetrics.forEach(gm => {
    const metric = metrics.find(m => m.id === gm.metric_id);
    if (metric) {
      // Linear progress within range: (current - initial) / (target - initial)
      const range = gm.target_value - (gm.initial_value || 0);
      const currentOffset = metric.current_value - (gm.initial_value || 0);
      
      let progress = 0;
      if (range === 0) {
        progress = metric.current_value >= gm.target_value ? 100 : 0;
      } else {
        progress = Math.min(100, Math.max(0, (currentOffset / range) * 100));
      }
      
      totalProgress += progress * gm.weight;
      totalWeight += gm.weight;
    }
  });

  return totalWeight > 0 ? totalProgress / totalWeight : 0;
};
