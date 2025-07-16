/**
 * Utility functions for date and time calculations
 */

/**
 * Get the current calendar week boundaries (Monday to Sunday)
 * This provides consistent week calculation across the entire application
 */
export function getCurrentCalendarWeek(): { start: Date; end: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6
  
  // Calculate days since Monday
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  // Start of current week (Monday at 00:00:00)
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - daysSinceMonday);
  weekStart.setHours(0, 0, 0, 0);
  
  // End of current week (Sunday at 23:59:59)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  return { start: weekStart, end: weekEnd };
}

/**
 * Get calendar week boundaries for a specific date
 */
export function getCalendarWeekForDate(date: Date): { start: Date; end: Date } {
  const targetDate = new Date(date);
  const dayOfWeek = targetDate.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6
  
  // Calculate days since Monday
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  // Start of week (Monday at 00:00:00)
  const weekStart = new Date(targetDate);
  weekStart.setDate(targetDate.getDate() - daysSinceMonday);
  weekStart.setHours(0, 0, 0, 0);
  
  // End of week (Sunday at 23:59:59)
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  return { start: weekStart, end: weekEnd };
}

/**
 * Calculate how many weeks have passed since a join date
 */
export function getWeeksSinceJoin(joinedAt: Date): number {
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - joinedAt.getTime()) / (1000 * 60 * 60 * 24),
  );
  return Math.max(1, Math.ceil(diffDays / 7));
}