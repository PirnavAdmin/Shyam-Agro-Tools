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

/**
 * Validates if a phone number is a valid, real Indian mobile number.
 * 
 * @param {string} phone - The phone number to validate
 * @returns {boolean} - True if phone number is valid
 */
export const isValidMobileNumber = (phone) => {
  if (!phone) return false;
  const trimmed = phone.trim().replace(/\s/g, "").replace(/-/g, "").replace(/^\+91/, "");
  
  // 1. Must match the Indian mobile number format: 10 digits starting with 6, 7, 8, or 9
  if (!/^[6-9]\d{9}$/.test(trimmed)) return false;
  
  // 2. Must have at least 3 distinct digits
  const distinctDigits = new Set(trimmed).size;
  if (distinctDigits < 3) return false;

  // 3. Reject 5 or more consecutive repeating digits (e.g. 9888881234)
  if (/(\d)\1{4,}/.test(trimmed)) return false;

  // 4. Reject repeating 2-digit pairs (e.g. 5454545454, 9898989898)
  if (/(\d{2})\1{3,}/.test(trimmed)) return false;

  // 5. Reject blacklisted invalid numbers
  const invalidPhones = [
    "1234567890", "0123456789", "9876543210", "1234567891", "6789012345",
    "9876543211", "9999999999", "8888888888", "7777777777", "6666666666",
    "5454545454", "9898989898", "9123456789", "6543210987", "0000000000"
  ];
  if (invalidPhones.includes(trimmed)) return false;

  return true;
};
