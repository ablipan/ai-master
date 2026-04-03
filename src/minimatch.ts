/**
 * Lightweight glob matcher — handles *, **, and ? without external deps.
 * Sufficient for whitelist pattern matching against relative file paths.
 */
export function minimatch(filePath: string, pattern: string): boolean {
  const normalized = filePath.replace(/\\/g, '/');
  const regex = globToRegex(pattern);
  return regex.test(normalized);
}

function globToRegex(pattern: string): RegExp {
  let regexStr = '';
  let i = 0;
  const len = pattern.length;

  while (i < len) {
    const c = pattern[i];

    if (c === '*') {
      if (pattern[i + 1] === '*') {
        if (pattern[i + 2] === '/') {
          regexStr += '(?:.+/)?';
          i += 3;
          continue;
        }
        regexStr += '.*';
        i += 2;
        continue;
      }
      regexStr += '[^/]*';
      i++;
      continue;
    }

    if (c === '?') {
      regexStr += '[^/]';
      i++;
      continue;
    }

    if (c === '.') {
      regexStr += '\\.';
      i++;
      continue;
    }

    regexStr += c;
    i++;
  }

  return new RegExp(`^${regexStr}$`);
}
