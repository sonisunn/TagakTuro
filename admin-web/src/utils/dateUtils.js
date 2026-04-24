/**
 * Sorts items by date with intelligent grouping
 * Upcoming: Today -> Tomorrow -> Next 7 days -> Further future
 * Past: Today -> Yesterday -> Last 7 days -> Much older
 */
export const sortByDateWithPriority = (items, dateField = 'bookingDateTime', direction = 'upcoming') => {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const sevenDaysAhead = new Date(today);
  sevenDaysAhead.setDate(sevenDaysAhead.getDate() + 7);
  
  const sevenDaysBehind = new Date(today);
  sevenDaysBehind.setDate(sevenDaysBehind.getDate() - 7);
  
  return [...items].sort((a, b) => {
    const dateA = new Date(a[dateField]);
    const dateB = new Date(b[dateField]);
    
    const dateANormalized = new Date(dateA);
    dateANormalized.setHours(0, 0, 0, 0);
    
    const dateBNormalized = new Date(dateB);
    dateBNormalized.setHours(0, 0, 0, 0);
    
    // Priority categories
    const getPriority = (date) => {
      if (direction === 'upcoming') {
        // For upcoming/future dates
        if (date.getTime() === today.getTime()) return 0; // Today - highest priority
        if (date.getTime() === tomorrow.getTime()) return 1; // Tomorrow
        if (date > today && date <= sevenDaysAhead) return 2; // Next 7 days
        if (date > sevenDaysAhead) return 3; // Further future
        if (date < today && date >= yesterday) return 4; // Yesterday
        if (date < today && date >= sevenDaysBehind) return 5; // Last 7 days
        return 6; // Much older
      } else {
        // For past/earlier dates - reverse order
        if (date.getTime() === today.getTime()) return 0; // Today - highest priority
        if (date.getTime() === yesterday.getTime()) return 1; // Yesterday
        if (date < today && date >= sevenDaysBehind) return 2; // Last 7 days
        if (date < sevenDaysBehind) return 3; // Much older
        if (date > today && date <= tomorrow) return 4; // Tomorrow
        if (date > tomorrow && date <= sevenDaysAhead) return 5; // Next 7 days
        return 6; // Further future
      }
    };
    
    const priorityA = getPriority(dateANormalized);
    const priorityB = getPriority(dateBNormalized);
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // Within same priority, sort by actual date
    if (direction === 'upcoming') {
      return dateA - dateB;
    } else {
      return dateB - dateA;
    }
  });
};

/**
 * Format date for display (simple format, no labels)
 */
export const formatDateDisplay = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format time range
 */
export const formatTimeRange = (dateTimeString, durationMinutes = 60) => {
  if (!dateTimeString) return 'N/A';
  
  const start = new Date(dateTimeString);
  const end = new Date(start.getTime() + durationMinutes * 60000);
  
  const format = (date) => date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return `${format(start)} - ${format(end)}`;
};
