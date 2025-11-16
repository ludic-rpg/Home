import { readFileSync } from 'fs';
import { join } from 'path';

interface Frontmatter {
  [key: string]: string;
}

interface Content {
  frontmatter: Frontmatter;
  body: string;
}

export function loadContent(lang: 'en' | 'fr', page: string): Content {
  const contentPath = join(process.cwd(), `src/content/${lang}/${page}.md`);
  const content = readFileSync(contentPath, 'utf-8');

  // Extract frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!frontmatterMatch) {
    return { frontmatter: {}, body: content };
  }

  const frontmatterText = frontmatterMatch[1];
  const body = frontmatterMatch[2];

  // Parse frontmatter (simple YAML parser)
  const frontmatter: Frontmatter = {};
  frontmatterText.split('\n').forEach(line => {
    const match = line.match(/^(\w+):\s*["']?(.+?)["']?$/);
    if (match) {
      frontmatter[match[1]] = match[2];
    }
  });

  return { frontmatter, body };
}
