export type Language = "python" | "java" | "c";

export interface CodeMetrics {
  totalLines: number;
  blankLines: number;
  commentLines: number;
  codeLines: number;
  functions: number;
  classes: number;
  variables: number;
  loops: number;
  conditionals: number;
  maxNestingDepth: number;
  avgFunctionLength: number;
  longestFunction: { name: string; lines: number } | null;
}

export interface ComplexityResult {
  time: string;
  space: string;
  timeExplanation: string;
  spaceExplanation: string;
  loopCount: number;
  maxNestingDepth: number;
  hasRecursion: boolean;
  variableCount: number;
  arrayCount: number;
}

export interface QualityIssue {
  type: "error" | "warning" | "info";
  message: string;
  line?: number;
}

export interface Suggestion {
  category: string;
  message: string;
  priority: "high" | "medium" | "low";
}

export interface AnalysisReport {
  language: Language;
  metrics: CodeMetrics;
  complexity: ComplexityResult;
  issues: QualityIssue[];
  suggestions: Suggestion[];
  analysisTimeMs: number;
}

// Language-specific patterns
const PATTERNS: Record<Language, {
  comment: { single: RegExp; multiStart: RegExp; multiEnd: RegExp };
  function: RegExp;
  class: RegExp;
  variable: RegExp;
  loop: RegExp;
  conditional: RegExp;
  array: RegExp;
  recursiveCall: (funcNames: string[]) => RegExp;
}> = {
  python: {
    comment: { single: /^\s*#/, multiStart: /^\s*("""|''')/, multiEnd: /("""|''')/ },
    function: /^\s*def\s+(\w+)\s*\(/,
    class: /^\s*class\s+\w+/,
    variable: /^\s*(\w+)\s*=(?!=)/,
    loop: /^\s*(for|while)\s+/,
    conditional: /^\s*(if|elif|else)\s*/,
    array: /\[\s*\]|\blist\s*\(|\bdict\s*\(|\bset\s*\(/,
    recursiveCall: (names) => new RegExp(`\\b(${names.join("|")})\\s*\\(`, "g"),
  },
  java: {
    comment: { single: /^\s*\/\//, multiStart: /^\s*\/\*/, multiEnd: /\*\// },
    function: /^\s*(?:public|private|protected|static|\s)*\s+\w+(?:<[^>]*>)?\s+(\w+)\s*\(/,
    class: /^\s*(?:public|private|protected)?\s*class\s+\w+/,
    variable: /^\s*(?:int|float|double|char|boolean|long|short|byte|String|var|final)\s+\w+/,
    loop: /^\s*(for|while|do)\s*[\s({]/,
    conditional: /^\s*(if|else\s+if|else|switch)\s*[\s({]/,
    array: /\w+\s*\[\s*\]|\bnew\s+\w+\s*\[|ArrayList|LinkedList|HashMap|HashSet/,
    recursiveCall: (names) => new RegExp(`\\b(${names.join("|")})\\s*\\(`, "g"),
  },
  c: {
    comment: { single: /^\s*\/\//, multiStart: /^\s*\/\*/, multiEnd: /\*\// },
    function: /^\s*(?:void|int|float|double|char|long|short|unsigned|signed|struct\s+\w+)\s*\*?\s+(\w+)\s*\(/,
    class: /^\s*(?:struct|typedef\s+struct)\s+\w+/,
    variable: /^\s*(?:int|float|double|char|long|short|unsigned|signed|void)\s*\*?\s+\w+/,
    loop: /^\s*(for|while|do)\s*[\s({]/,
    conditional: /^\s*(if|else\s+if|else|switch)\s*[\s({]/,
    array: /\w+\s*\[\s*\d*\s*\]|\bmalloc\s*\(|\bcalloc\s*\(|\brealloc\s*\(/,
    recursiveCall: (names) => new RegExp(`\\b(${names.join("|")})\\s*\\(`, "g"),
  },
};

function countMetrics(lines: string[], lang: Language): CodeMetrics {
  const p = PATTERNS[lang];
  let blankLines = 0, commentLines = 0, functions = 0, classes = 0;
  let variables = 0, loops = 0, conditionals = 0;
  let inMultiComment = false;
  let maxNesting = 0, currentNesting = 0;
  const functionLengths: { name: string; lines: number }[] = [];
  let currentFunc: { name: string; start: number } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "") { blankLines++; continue; }

    if (inMultiComment) {
      commentLines++;
      if (p.comment.multiEnd.test(trimmed)) inMultiComment = false;
      continue;
    }
    if (p.comment.multiStart.test(trimmed)) {
      commentLines++;
      if (!p.comment.multiEnd.test(trimmed.replace(p.comment.multiStart, ""))) inMultiComment = true;
      continue;
    }
    if (p.comment.single.test(trimmed)) { commentLines++; continue; }

    const funcMatch = trimmed.match(p.function);
    if (funcMatch) {
      if (currentFunc) {
        functionLengths.push({ name: currentFunc.name, lines: i - currentFunc.start });
      }
      currentFunc = { name: funcMatch[1], start: i };
      functions++;
    }
    if (p.class.test(trimmed)) classes++;
    if (p.variable.test(trimmed)) variables++;
    if (p.loop.test(trimmed)) loops++;
    if (p.conditional.test(trimmed)) conditionals++;

    // Track nesting via braces (or indentation for Python)
    if (lang === "python") {
      const indent = line.search(/\S/);
      const depth = Math.floor(indent / 4);
      if (depth > maxNesting) maxNesting = depth;
    } else {
      for (const ch of line) {
        if (ch === "{") { currentNesting++; if (currentNesting > maxNesting) maxNesting = currentNesting; }
        if (ch === "}") currentNesting--;
      }
    }
  }

  if (currentFunc) {
    functionLengths.push({ name: currentFunc.name, lines: lines.length - currentFunc.start });
  }

  const longest = functionLengths.length > 0
    ? functionLengths.reduce((a, b) => a.lines > b.lines ? a : b)
    : null;

  const avgLen = functionLengths.length > 0
    ? Math.round(functionLengths.reduce((s, f) => s + f.lines, 0) / functionLengths.length)
    : 0;

  return {
    totalLines: lines.length,
    blankLines,
    commentLines,
    codeLines: lines.length - blankLines - commentLines,
    functions,
    classes,
    variables,
    loops,
    conditionals,
    maxNestingDepth: maxNesting,
    avgFunctionLength: avgLen,
    longestFunction: longest,
  };
}

function analyzeComplexity(lines: string[], lang: Language, metrics: CodeMetrics): ComplexityResult {
  const p = PATTERNS[lang];
  
  // Detect recursion
  const funcNames: string[] = [];
  for (const line of lines) {
    const m = line.match(p.function);
    if (m) funcNames.push(m[1]);
  }

  let hasRecursion = false;
  if (funcNames.length > 0) {
    const recPattern = p.recursiveCall(funcNames);
    let inFunc: string | null = null;
    for (const line of lines) {
      const fm = line.match(p.function);
      if (fm) inFunc = fm[1];
      if (inFunc) {
        const calls = line.match(recPattern);
        if (calls) {
          for (const c of calls) {
            const calledName = c.replace(/\s*\($/, "");
            if (calledName === inFunc) hasRecursion = true;
          }
        }
      }
    }
  }

  // Array/data structure count
  let arrayCount = 0;
  for (const line of lines) {
    const matches = line.match(p.array);
    if (matches) arrayCount += matches.length;
  }

  // Time complexity estimation
  let time: string;
  let timeExplanation: string;
  const { loops, maxNestingDepth } = metrics;

  if (hasRecursion && loops === 0) {
    time = "O(2^n)";
    timeExplanation = `Recursion detected without iterative loops. Worst-case exponential assumed. Consider memoization.`;
  } else if (maxNestingDepth >= 3 && loops >= 3) {
    time = "O(n³)";
    timeExplanation = `${loops} loops with max nesting depth ${maxNestingDepth} suggests cubic complexity.`;
  } else if (maxNestingDepth >= 2 && loops >= 2) {
    time = "O(n²)";
    timeExplanation = `${loops} loops with nesting depth ${maxNestingDepth} indicates quadratic complexity.`;
  } else if (hasRecursion && loops >= 1) {
    time = "O(n log n)";
    timeExplanation = `Recursion combined with ${loops} loop(s) suggests divide-and-conquer pattern.`;
  } else if (loops >= 1) {
    time = "O(n)";
    timeExplanation = `${loops} loop(s) without deep nesting suggests linear complexity.`;
  } else {
    time = "O(1)";
    timeExplanation = `No loops or recursion detected. Constant time operations only.`;
  }

  // Space complexity estimation
  let space: string;
  let spaceExplanation: string;

  if (hasRecursion && arrayCount > 0) {
    space = "O(n)";
    spaceExplanation = `Recursive call stack + ${arrayCount} data structure(s) detected. Linear space usage.`;
  } else if (hasRecursion) {
    space = "O(n)";
    spaceExplanation = `Recursive call stack usage detected. Stack depth proportional to input size.`;
  } else if (arrayCount >= 2) {
    space = "O(n)";
    spaceExplanation = `${arrayCount} arrays/data structures detected. Space grows with input.`;
  } else if (arrayCount === 1) {
    space = "O(n)";
    spaceExplanation = `1 array/data structure detected. Space may grow with input size.`;
  } else {
    space = "O(1)";
    spaceExplanation = `${metrics.variables} primitive variables, no dynamic data structures. Constant space.`;
  }

  return {
    time,
    space,
    timeExplanation,
    spaceExplanation,
    loopCount: loops,
    maxNestingDepth,
    hasRecursion,
    variableCount: metrics.variables,
    arrayCount,
  };
}

function checkQuality(lines: string[], lang: Language, metrics: CodeMetrics): QualityIssue[] {
  const issues: QualityIssue[] = [];

  // Bracket matching (for C/Java)
  if (lang !== "python") {
    const stack: { char: string; line: number }[] = [];
    const pairs: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
    const opens = new Set(["(", "[", "{"]);
    for (let i = 0; i < lines.length; i++) {
      for (const ch of lines[i]) {
        if (opens.has(ch)) stack.push({ char: ch, line: i + 1 });
        if (pairs[ch]) {
          const top = stack.pop();
          if (!top || top.char !== pairs[ch]) {
            issues.push({ type: "error", message: `Unmatched bracket '${ch}'`, line: i + 1 });
          }
        }
      }
    }
    for (const s of stack) {
      issues.push({ type: "error", message: `Unmatched bracket '${s.char}'`, line: s.line });
    }
  }

  // Long functions
  if (metrics.longestFunction && metrics.longestFunction.lines > 50) {
    issues.push({
      type: "warning",
      message: `Function '${metrics.longestFunction.name}' is ${metrics.longestFunction.lines} lines long (recommended: <50)`,
    });
  }

  // Deep nesting
  if (metrics.maxNestingDepth > 4) {
    issues.push({
      type: "warning",
      message: `Maximum nesting depth is ${metrics.maxNestingDepth} (recommended: ≤4)`,
    });
  }

  // Too many loops/conditions in code
  if (metrics.loops > 10) {
    issues.push({
      type: "warning",
      message: `${metrics.loops} loops detected — consider refactoring for clarity`,
    });
  }
  if (metrics.conditionals > 15) {
    issues.push({
      type: "warning",
      message: `${metrics.conditionals} conditional statements — consider simplifying logic`,
    });
  }

  // Low comment density
  const commentRatio = metrics.commentLines / Math.max(metrics.codeLines, 1);
  if (commentRatio < 0.05 && metrics.codeLines > 10) {
    issues.push({
      type: "info",
      message: `Comment density is ${(commentRatio * 100).toFixed(1)}% — consider adding more comments`,
    });
  }

  // Basic unused variable detection (very naive — checks if declared var name appears only once)
  if (lang !== "python") {
    const varPattern = lang === "java"
      ? /(?:int|float|double|char|boolean|long|short|byte|String|var)\s+(\w+)/g
      : /(?:int|float|double|char|long|short|unsigned)\s*\*?\s+(\w+)/g;
    const code = lines.join("\n");
    let match;
    while ((match = varPattern.exec(code)) !== null) {
      const varName = match[1];
      const occurrences = code.split(new RegExp(`\\b${varName}\\b`)).length - 1;
      if (occurrences <= 1) {
        issues.push({
          type: "warning",
          message: `Variable '${varName}' may be unused (appears only once)`,
        });
      }
    }
  }

  return issues;
}

function generateSuggestions(metrics: CodeMetrics, complexity: ComplexityResult, issues: QualityIssue[]): Suggestion[] {
  const suggestions: Suggestion[] = [];

  if (metrics.longestFunction && metrics.longestFunction.lines > 30) {
    suggestions.push({
      category: "Refactoring",
      message: `Break '${metrics.longestFunction.name}' (${metrics.longestFunction.lines} lines) into smaller functions of 20-30 lines each.`,
      priority: "high",
    });
  }

  if (complexity.maxNestingDepth > 3) {
    suggestions.push({
      category: "Readability",
      message: `Reduce nesting depth (currently ${complexity.maxNestingDepth}). Use early returns, guard clauses, or extract helper functions.`,
      priority: "high",
    });
  }

  if (complexity.time === "O(n²)" || complexity.time === "O(n³)") {
    suggestions.push({
      category: "Performance",
      message: `Consider optimizing nested loops. Use hash maps or sorting to potentially reduce ${complexity.time} to O(n log n) or O(n).`,
      priority: "high",
    });
  }

  if (complexity.hasRecursion) {
    suggestions.push({
      category: "Performance",
      message: "Add memoization or convert to iterative approach to avoid potential stack overflow.",
      priority: "medium",
    });
  }

  const commentRatio = metrics.commentLines / Math.max(metrics.codeLines, 1);
  if (commentRatio < 0.1 && metrics.codeLines > 10) {
    suggestions.push({
      category: "Documentation",
      message: `Add more comments. Current density is ${(commentRatio * 100).toFixed(1)}%. Aim for 10-20% for better maintainability.`,
      priority: "medium",
    });
  }

  const unusedVarIssues = issues.filter(i => i.message.includes("unused"));
  if (unusedVarIssues.length > 0) {
    suggestions.push({
      category: "Cleanup",
      message: `Remove ${unusedVarIssues.length} potentially unused variable(s) to keep the code clean.`,
      priority: "low",
    });
  }

  if (metrics.functions === 0 && metrics.codeLines > 20) {
    suggestions.push({
      category: "Structure",
      message: "No functions detected. Consider organizing code into functions for reusability and testability.",
      priority: "medium",
    });
  }

  return suggestions;
}

export function detectLanguage(filename: string): Language | null {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "py") return "python";
  if (ext === "java") return "java";
  if (ext === "c" || ext === "h") return "c";
  return null;
}

export function analyzeCode(code: string, language: Language): AnalysisReport {
  const start = performance.now();
  const lines = code.split("\n");

  const metrics = countMetrics(lines, language);
  const complexity = analyzeComplexity(lines, language, metrics);
  const issues = checkQuality(lines, language, metrics);
  const suggestions = generateSuggestions(metrics, complexity, issues);

  return {
    language,
    metrics,
    complexity,
    issues,
    suggestions,
    analysisTimeMs: Math.round((performance.now() - start) * 100) / 100,
  };
}
