import LZString from 'lz-string';

/**
 * Compresses an array of numbers (invocation IDs) into a URL-safe string.
 */
export const compressQueue = (ids: Array<number>): string => {
  if (ids.length === 0) return '';
  const data = ids.join(',');
  return LZString.compressToEncodedURIComponent(data);
};

/**
 * Decompresses a URL-safe string back into an array of numbers (invocation IDs).
 */
export const decompressQueue = (compressed: string): Array<number> => {
  if (!compressed) return [];
  try {
    const decompressed = LZString.decompressFromEncodedURIComponent(compressed);
    if (!decompressed) return [];
    return decompressed.split(',').map(Number).filter((n) => !isNaN(n));
  } catch (error) {
    console.error('Failed to decompress queue:', error);
    return [];
  }
};
