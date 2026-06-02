const fs = require('fs');
const content = fs.readFileSync('src/app/components/sports/SportsAdmin.tsx', 'utf8');
const lines = content.split('\n');

// We need to find where the return statement of SportsAdmin begins and ends
// Then track all JSX element nesting

const tagStack = [];
const issues = [];
const returnStart = 2192; // 0-indexed for line 2193
const returnEnd = 5708;   // 0-indexed for line 5709

// Simple JSX tag parser (not perfect but good enough)
for (let i = returnStart; i <= returnEnd; i++) {
  const line = lines[i];
  const lineNum = i + 1;
  
  // Skip lines that are just comments
  if (line.trim().startsWith('//') || line.trim().startsWith('{/*')) continue;
  
  // Find all tags in the line using a simple regex approach
  // Match opening tags: <TagName or <tag-name
  const openPattern = /<([a-zA-Z][a-zA-Z0-9.]*)\b[^>]*?(?:\/?>)/g;
  let match;
  
  while ((match = openPattern.exec(line)) !== null) {
    const fullMatch = match[0];
    const tagName = match[1];
    
    // Skip fragments <>
    if (tagName === '') continue;
    
    // Check if self-closing
    if (fullMatch.endsWith('/>')) {
      // Self-closing, skip
      continue;
    }
    
    // Opening tag
    tagStack.push({ tag: tagName, line: lineNum, depth: tagStack.length });
  }
  
  // Find closing tags: </TagName>
  const closePattern = /<\/([a-zA-Z][a-zA-Z0-9.]*)\s*>/g;
  while ((match = closePattern.exec(line)) !== null) {
    const tagName = match[1];
    
    if (tagStack.length === 0) {
      issues.push(`Line ${lineNum}: Closing </${tagName}> with empty stack!`);
      continue;
    }
    
    const top = tagStack[tagStack.length - 1];
    if (top.tag !== tagName) {
      issues.push(`Line ${lineNum}: Closing </${tagName}> but expected </${top.tag}> (opened at line ${top.line}). Stack depth: ${tagStack.length}`);
      
      // Try to find matching tag in stack
      let found = false;
      for (let j = tagStack.length - 1; j >= 0; j--) {
        if (tagStack[j].tag === tagName) {
          // Pop everything up to and including the matching tag
          const popped = tagStack.splice(j);
          issues.push(`  -> Popping ${popped.length} items to match: ${popped.map(p => `<${p.tag}> at L${p.line}`).join(', ')}`);
          found = true;
          break;
        }
      }
      if (!found) {
        issues.push(`  -> No matching opening tag found in stack for </${tagName}>!`);
      }
    } else {
      tagStack.pop();
    }
  }
}

console.log('=== ISSUES FOUND ===');
issues.forEach(i => console.log(i));
console.log('\n=== REMAINING UNCLOSED TAGS ===');
tagStack.forEach(t => console.log(`  <${t.tag}> at line ${t.line} (depth ${t.depth})`));
console.log(`\nTotal unclosed: ${tagStack.length}`);
