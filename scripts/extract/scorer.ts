// scripts/extract/scorer.ts
type Difficulty = 'easy' | 'medium' | 'hard';

const SYMBOL_CHARS = /[{}[\]();:<>!?@#$%^&*+=|\\~`]/g;

export function calculateDifficulty(content: string): Difficulty {
  const symbols = (content.match(SYMBOL_CHARS) || []).length;
  const totalChars = content.replace(/\s/g, '').length;
  const symbolDensity = totalChars > 0 ? symbols / totalChars : 0;
  
  const hasGenerics = /<[A-Z][a-zA-Z]*>/.test(content);
  const hasMacros = /#\s*(define|ifdef|ifndef|pragma)/.test(content);
  const hasRegex = /\/(?:[^\/\\]|\\.)*\/[gimsuy]*/.test(content);
  
  let nestingDepth = 0;
  let maxNesting = 0;
  for (const char of content) {
    if (char === '{' || char === '(' || char === '[') {
      nestingDepth++;
      maxNesting = Math.max(maxNesting, nestingDepth);
    } else if (char === '}' || char === ')' || char === ']') {
      nestingDepth--;
    }
  }
  
  let score = 0;
  
  if (symbolDensity > 0.35) score += 2;
  else if (symbolDensity > 0.15) score += 1;
  
  if (hasGenerics) score += 2;
  if (hasMacros) score += 2;
  if (hasRegex) score += 1;
  
  if (maxNesting >= 4) score += 2;
  else if (maxNesting >= 2) score += 1;
  
  if (score >= 5) return 'hard';
  if (score >= 2) return 'medium';
  return 'easy';
}
