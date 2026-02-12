// Utility functions for creating and parsing slugs

/**
 * Convert Arabic/English text to URL-friendly slug
 * @param {string} text - The text to convert
 * @returns {string} - URL-friendly slug
 */
export const createSlug = (text) => {
  if (!text) return '';
  
  return text
    .toString()
    .trim()
    .toLowerCase()
    // Replace spaces with hyphens
    .replace(/\s+/g, '-')
    // Remove special characters except Arabic letters, English letters, numbers, and hyphens
    .replace(/[^\u0600-\u06FF\w-]+/g, '')
    // Replace multiple hyphens with single hyphen
    .replace(/--+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');
};

/**
 * Create a unique slug with ID
 * @param {string} title - Service title
 * @param {number} id - Service ID
 * @returns {string} - Unique slug
 */
export const createUniqueSlug = (title, id) => {
  const slug = createSlug(title);
  return `${slug}-${id}`;
};

/**
 * Extract ID from slug
 * @param {string} slug - The slug containing ID
 * @returns {number|null} - Extracted ID or null
 */
export const extractIdFromSlug = (slug) => {
  if (!slug) return null;
  
  // Extract the last number after the last hyphen
  const parts = slug.split('-');
  const lastPart = parts[parts.length - 1];
  const id = parseInt(lastPart);
  
  return isNaN(id) ? null : id;
};
