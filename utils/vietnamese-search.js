// Vietnamese text normalization for search
// Removes diacritics to match variations like "vận tải" = "van tai"

const VIETNAMESE_MAP = {
  'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
  'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
  'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
  
  'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
  'ê': 'e', 'ề': 'e', 'ế': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
  
  'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
  
  'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
  'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
  'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
  
  'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
  'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
  
  'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
  
  'đ': 'd'
};

/**
 * Remove Vietnamese accents/diacritics
 * Example: "vận tải" -> "van tai"
 */
function removeAccents(text) {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .split('')
    .map(char => VIETNAMESE_MAP[char] || char)
    .join('')
    .replace(/[^\w\s]/g, '') // Remove special characters
    .trim();
}

/**
 * Normalize text for fuzzy matching
 */
function normalizeForSearch(text) {
  return removeAccents(text)
    .split(/\s+/)
    .filter(word => word.length > 0)
    .join(' ');
}

/**
 * Generate search variations
 * Example: "vận tải" generates ["vận tải", "van tai", "vân tai"]
 */
function generateSearchVariations(text) {
  const variations = new Set();
  
  variations.add(text); // Original
  variations.add(removeAccents(text)); // Without accents
  
  // Add partial matches (by words)
  const words = text.split(/\s+/);
  if (words.length > 1) {
    words.forEach(word => {
      variations.add(word);
      variations.add(removeAccents(word));
    });
  }
  
  return Array.from(variations).filter(v => v && v.length > 0);
}

module.exports = {
  removeAccents,
  normalizeForSearch,
  generateSearchVariations
};
