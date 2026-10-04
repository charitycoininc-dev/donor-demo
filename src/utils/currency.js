/**
 * Format a number as currency with 2 decimal places (showing cents)
 * @param {number} amount - The amount to format
 * @returns {string} - Formatted currency string (e.g., "$1,234.56")
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "$0.00";
  }
  
  // Ensure it's a number and round to 2 decimal places
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return "$0.00";
  }
  
  // Format with 2 decimal places and thousand separators
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
}

/**
 * Format a number as currency without the $ symbol (for cases where $ is added separately)
 * @param {number} amount - The amount to format
 * @returns {string} - Formatted string (e.g., "1,234.56")
 */
export function formatCurrencyNumber(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "0.00";
  }
  
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return "0.00";
  }
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
}

