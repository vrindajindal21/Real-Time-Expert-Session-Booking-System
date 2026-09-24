/**
 * Generates time slots between a start and end time with a specific duration
 * @param {Date} date - The date to generate slots for
 * @param {string} startTime - format 'HH:mm'
 * @param {string} endTime - format 'HH:mm'
 * @param {number} duration - in minutes
 * @returns {Array} Array of time slot objects
 */
exports.generateSlots = (date, startTime, endTime, duration) => {
  const slots = [];
  const start = new Date(`${date.toISOString().split('T')[0]}T${startTime}:00`);
  const end = new Date(`${date.toISOString().split('T')[0]}T${endTime}:00`);
  
  let current = new Date(start);
  
  while (current < end) {
    const slotStart = new Date(current);
    const slotEnd = new Date(current.getTime() + duration * 60000);
    
    if (slotEnd > end) break;
    
    slots.push({
      date: new Date(date),
      startTime: formatTime(slotStart),
      endTime: formatTime(slotEnd),
      isBooked: false
    });
    
    current = new Date(slotEnd);
  }
  
  return slots;
};

function formatTime(date) {
  return date.toTimeString().substring(0, 5);
}
