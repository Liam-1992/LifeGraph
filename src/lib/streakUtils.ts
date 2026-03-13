import { HabitLog } from '../types';

export const calculateStreak = (habitId: string, logs: HabitLog[]) => {
  const dates = Array.from(new Set(logs
    .filter(log => log.habit_id === habitId)
    .map(log => log.completed_at.split('T')[0])))
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  if (dates.length === 0) return { current: 0, longest: 0 };

  let longest = 0;
  let current = 0;
  let tempLongest = 0;

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Check if streak is active
  const lastDate = dates[dates.length - 1];
  const isActive = lastDate === today || lastDate === yesterday;

  for (let i = 0; i < dates.length; i++) {
    if (i === 0) {
      tempLongest = 1;
    } else {
      const diff = (new Date(dates[i]).getTime() - new Date(dates[i-1]).getTime()) / 86400000;
      if (diff === 1) {
        tempLongest++;
      } else {
        longest = Math.max(longest, tempLongest);
        tempLongest = 1;
      }
    }
  }
  longest = Math.max(longest, tempLongest);
  
  // Current streak
  if (!isActive) {
    current = 0;
  } else {
    // Recalculate current streak from the end
    current = 1;
    for (let i = dates.length - 2; i >= 0; i--) {
      const diff = (new Date(dates[i+1]).getTime() - new Date(dates[i]).getTime()) / 86400000;
      if (diff === 1) {
        current++;
      } else {
        break;
      }
    }
  }

  return { current, longest };
};
