import { Hand, GeneratedPattern, TwoMeasurePattern, PatternVariant } from '../types';

export type PatternMode = 'sequential' | 'random';

// Each base pattern has 3 variants
export const VARIANTS_PER_PATTERN = 3;

/**
 * Generates a pattern at the given index using bit manipulation.
 * Each bit position represents a note: 0 = R, 1 = L
 * For a pattern of length n, there are 2^n possible patterns (indices 0 to 2^n - 1)
 */
export function getPatternAtIndex(index: number, length: number): GeneratedPattern {
  const sticking: Hand[] = [];

  for (let i = 0; i < length; i++) {
    // Check the bit at position i (from most significant to least for left-to-right reading)
    const bitPosition = length - 1 - i;
    const bit = (index >> bitPosition) & 1;
    sticking.push(bit === 0 ? 'R' : 'L');
  }

  return {
    id: index,
    sticking,
  };
}

/**
 * Reverses a pattern by swapping L <-> R for measure 2
 */
export function reversePattern(pattern: GeneratedPattern): GeneratedPattern {
  const reversedSticking: Hand[] = pattern.sticking.map(hand =>
    hand === 'L' ? 'R' : 'L'
  );

  // Calculate the reversed pattern's index
  const length = pattern.sticking.length;
  const totalPatterns = Math.pow(2, length);
  const reversedId = totalPatterns - 1 - pattern.id;

  return {
    id: reversedId,
    sticking: reversedSticking,
  };
}

/**
 * Creates a two-measure pattern pair where measure 2 is the L/R reversal of measure 1
 */
export function createTwoMeasurePattern(pattern: GeneratedPattern): TwoMeasurePattern {
  return {
    measure1: pattern,
    measure2: reversePattern(pattern),
  };
}

/**
 * Creates a two-measure pattern based on the variant type:
 * - 'pattern-pattern': same pattern in both measures
 * - 'reversal-reversal': reversed pattern in both measures
 * - 'pattern-reversal': original then reversed
 */
export function createTwoMeasurePatternVariant(
  pattern: GeneratedPattern,
  variant: PatternVariant
): TwoMeasurePattern {
  const reversed = reversePattern(pattern);

  switch (variant) {
    case 'pattern-pattern':
      return { measure1: pattern, measure2: pattern };
    case 'reversal-reversal':
      return { measure1: reversed, measure2: reversed };
    case 'pattern-reversal':
      return { measure1: pattern, measure2: reversed };
  }
}

/**
 * Gets the variant type from a combined index (0-2 maps to the 3 variants)
 */
export function getVariantFromIndex(variantIndex: number): PatternVariant {
  const variants: PatternVariant[] = ['pattern-pattern', 'reversal-reversal', 'pattern-reversal'];
  return variants[variantIndex % VARIANTS_PER_PATTERN];
}

/**
 * Converts a combined pattern index to base pattern index and variant
 * Combined index = basePatternIndex * 3 + variantIndex
 */
export function decomposePatternIndex(combinedIndex: number): { baseIndex: number; variantIndex: number } {
  return {
    baseIndex: Math.floor(combinedIndex / VARIANTS_PER_PATTERN),
    variantIndex: combinedIndex % VARIANTS_PER_PATTERN,
  };
}

/**
 * Combines a base pattern index and variant index into a single combined index
 */
export function composePatternIndex(baseIndex: number, variantIndex: number): number {
  return baseIndex * VARIANTS_PER_PATTERN + variantIndex;
}

/**
 * Returns a display name for common rudiments or a generic "Pattern #N" name
 */
export function getPatternDisplayName(pattern: GeneratedPattern): string {
  const stickingStr = pattern.sticking.join('');

  // Common rudiment patterns (8-note)
  const rudiments8: Record<string, string> = {
    'RLRLRLRL': 'Single Stroke Roll',
    'LRLRLRLR': 'Single Stroke Roll (L)',
    'RRLLRRLL': 'Double Stroke Roll',
    'LLRRLLRR': 'Double Stroke Roll (L)',
    'RLRRLRLL': 'Single Paradiddle',
    'LRLLRLRR': 'Single Paradiddle (L)',
    'RLLRLLRL': 'Inverted Paradiddle',
    'LRRLRRRL': 'Inverted Paradiddle (L)',
    'RRLRLLRL': 'Double Paradiddle',
    'LLRLRRRL': 'Double Paradiddle (L)',
    'RRRLRRRL': 'Flam Accent (R)',
    'LLLRLLLR': 'Flam Accent (L)',
  };

  // Check for known patterns
  if (rudiments8[stickingStr]) {
    return rudiments8[stickingStr];
  }

  // Check for repeating patterns
  const length = pattern.sticking.length;

  // Check for 2-note repeating pattern (e.g., RLRLRLRL)
  if (length >= 4 && length % 2 === 0) {
    const unit2 = stickingStr.slice(0, 2);
    if (unit2.repeat(length / 2) === stickingStr) {
      return `${unit2} Pattern`;
    }
  }

  // Check for 4-note repeating pattern
  if (length >= 8 && length % 4 === 0) {
    const unit4 = stickingStr.slice(0, 4);
    if (unit4.repeat(length / 4) === stickingStr) {
      return `${unit4} Pattern`;
    }
  }

  // Default: Pattern number (1-indexed for display)
  return `Pattern #${pattern.id + 1}`;
}

/**
 * Returns a display name for a pattern variant
 */
export function getVariantDisplayName(combinedIndex: number, notesInMeasure: number): string {
  const { baseIndex, variantIndex } = decomposePatternIndex(combinedIndex);
  const normalizedBase = ((baseIndex % getBasePatternCount(notesInMeasure)) + getBasePatternCount(notesInMeasure)) % getBasePatternCount(notesInMeasure);
  const pattern = getPatternAtIndex(normalizedBase, notesInMeasure);
  const baseName = getPatternDisplayName(pattern);

  const variantLabels = ['(×2)', '(Rev ×2)', '(+ Rev)'];
  return `${baseName} ${variantLabels[variantIndex]}`;
}

/**
 * Gets the total number of base patterns for a given measure length
 */
export function getBasePatternCount(length: number): number {
  return Math.pow(2, length);
}

/**
 * Gets the total number of pattern variants (base patterns × 3) for a given measure length
 */
export function getTotalPatterns(length: number): number {
  return getBasePatternCount(length) * VARIANTS_PER_PATTERN;
}

/**
 * Generates a random pattern index for the given length
 */
export function getRandomPatternIndex(length: number): number {
  return Math.floor(Math.random() * getTotalPatterns(length));
}

/**
 * Validates and wraps a pattern index to ensure it's within bounds
 */
export function normalizePatternIndex(index: number, length: number): number {
  const total = getTotalPatterns(length);
  return ((index % total) + total) % total;
}
