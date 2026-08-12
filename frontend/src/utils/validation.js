/**
 * Validates if a user name is a meaningful full name.
 * Excludes gibberish strings, random characters, and invalid spacing/casing.
 * 
 * @param {string} name - The name to validate
 * @returns {boolean} - True if name is meaningful and valid
 */
export const isValidName = (name) => {
  if (!name) return false;
  const trimmed = name.trim();
  
  // 1. Length constraint (between 2 and 50 characters)
  if (trimmed.length < 2 || trimmed.length > 50) return false;

  // 2. Alphanumeric, spaces, hyphens, and underscores only
  if (!/^[a-zA-Z0-9\s_'-]+$/.test(trimmed)) return false;

  // 3. Must contain at least 2 alphabetic characters
  const letters = trimmed.replace(/[^a-zA-Z]/g, '');
  if (letters.length < 2) return false;

  // 4. Check for consecutive identical characters (max 2 allowed, e.g., "Lee" is ok, "Jooohn" is not)
  if (/(.)\1{2,}/i.test(trimmed)) return false;

  // 5. Must not contain 5 or more consecutive consonants (including y) to detect keyboard mashing (e.g. xyzqwe)
  if (/[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]{5,}/.test(trimmed)) return false;

  // 5. Check each word for gibberish patterns
  // Split by spaces, hyphens, or underscores
  const words = trimmed.split(/[\s_-]+/);
  for (const word of words) {
    if (!word) continue;

    // Clean word from punctuation/apostrophes and handle common name prefixes (e.g. Mc, Mac, O', D')
    const cleanWord = word
      .replace(/['.]/g, '')
      .replace(/^(O|D|Mc|Mac)(?=[A-Z])/i, '');
    if (!cleanWord) continue;

    // If word is 3+ characters, it must contain at least one vowel (including y)
    if (cleanWord.length >= 3 && !/[aeiouyAEIOUY]/.test(cleanWord)) {
      return false;
    }

    // Gibberish casing check for words longer than 2 characters
    if (cleanWord.length > 2) {
      const isAllUpper = /^[A-Z]+$/.test(cleanWord);
      const isAllLower = /^[a-z]+$/.test(cleanWord);
      const isTitleCase = /^[A-Z][a-z]+$/.test(cleanWord);
      
      // If it doesn't match any standard casing patterns, it's invalid (e.g. asQVDEWJFGEBGDE, JOhn, joHn)
      if (!isAllUpper && !isAllLower && !isTitleCase) {
        return false;
      }
    }
  }

  return true;
};
