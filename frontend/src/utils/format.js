/**
 * Formats a number into Vietnamese Dong (VND) currency format.
 * Example: 1000000 -> 1.000.000 VNĐ
 * 
 * @param {number|string} amount - The numeric value to format
 * @returns {string} Formatted currency string
 */
export const formatVND = (amount) => {
  if (amount === undefined || amount === null) return '0 VNĐ';
  
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  return new Intl.NumberFormat('vi-VN').format(numericAmount) + ' VNĐ';
};

/**
 * Formats a number with dots for input fields.
 * Example: 1000000 -> 1.000.000
 */
export const formatDots = (amount) => {
  if (amount === undefined || amount === null || amount === '') return '';
  const numericAmount = typeof amount === 'string' ? amount.replace(/\D/g, '') : amount;
  return new Intl.NumberFormat('vi-VN').format(numericAmount);
};

/**
 * Parses a string with dots back into a number.
 * Example: 1.000.000 -> 1000000
 */
export const parseDots = (value) => {
  if (!value) return 0;
  return parseInt(value.replace(/\D/g, '')) || 0;
};
