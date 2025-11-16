# Translation Guide

## Current Workflow (JSON-based)

Right now you have to edit JSON files:
- `src/i18n/en.json` - English content
- `src/i18n/fr.json` - French content

**Problem:** JSON is hard to write and maintain.

## Better Approach: Write Markdown, Auto-Generate JSON

Here's what I recommend:

### Option 1: AI Translation Script (Current)

**Workflow:**
1. Edit `src/i18n/en.json` (English only)
2. Run `npm run translate` (auto-translates to French)
3. Review/edit French if needed

**Pros:**
- ✅ Only write English
- ✅ Automatic French translations
- ✅ High quality (AI-powered)

**Cons:**
- ❌ Still editing JSON

### Option 2: Markdown Content + AI Translation (Better)

**What you'd write (content/en/home.md):**
\`\`\`markdown
---
title: Welcome to Ludic RPG
---

# Ludic RPG

Crafting unique RPG experiences.

## About

Creative experiments mixing narrative, visuals, props, and technology.
\`\`\`

**What gets generated automatically:**
- `content/fr/home.md` (translated Markdown)
- OR `src/i18n/en.json` + `src/i18n/fr.json`

**Would you like me to implement this?**

### Option 3: Hybrid Approach (Simplest)

Keep JSON for **UI elements** (buttons, labels, short text):
\`\`\`json
{
  "nav": {
    "about": "About"
  }
}
\`\`\`

Use **Markdown files** for **long content** (blog posts, pages):
\`\`\`
content/
├── en/
│   └── about.md
└── fr/
    └── about.md
\`\`\`

Then run AI translation:
\`\`\`bash
npm run translate        # Translates JSON
npm run translate:md     # Translates Markdown files
\`\`\`

---

## My Recommendation

**Keep the current system** but use the AI translation script:

1. **Write English only** in `src/i18n/en.json`
2. **Run `npm run translate`** to auto-generate French
3. **Review** the French translations (AI is 95% accurate)
4. **Commit** both files

This way:
- ✅ You only write English
- ✅ French is automated
- ✅ You can fix any mistakes manually
- ✅ Simple workflow

The JSON structure is actually good because it:
- Forces you to think about structure
- Makes translations reusable
- Works perfectly with Astro's component system

---

## Alternative: Just Write in English

If managing translations is too much pain, consider:

**Option: English-only site**
- Remove `/fr/` entirely
- Keep it simple
- Add French later if needed

Most international sites start English-only. You can always add translations later when you have more content.

What do you prefer?
