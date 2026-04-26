#!/usr/bin/env python3
"""
generate_toc.py — Regenerates index.html for the Claude OS dashboard.

Usage:
    python3 generate_toc.py

Scans all 6 category folders, extracts app titles from HTML files,
and produces a fully self-contained index.html dashboard.
"""

import os
import re
from datetime import date
from pathlib import Path

BASE_DIR = Path(__file__).parent

CATEGORIES = [
    {
        "num": "01", "key": "input", "name": "Input",
        "desc": "Capturing information, signals, and data",
        "css_class": "cat-input",
        "folder": "01_input",
        "coming_soon": [
            ("Passive Data Aggregator", "Collects inputs from multiple sources into a single feed"),
            ("Voice Capture → Structured Notes", "Converts voice memos into tagged, searchable notes"),
            ("Environment Scanner", "Context-aware input capture based on location, time, and energy"),
        ],
    },
    {
        "num": "02", "key": "organize", "name": "Organize",
        "desc": "Structuring and storing information",
        "css_class": "cat-organize",
        "folder": "02_organize",
        "coming_soon": [
            ("Unified Knowledge Graph", "Maps connections between people, ideas, and projects"),
            ("Auto-tagging Engine", "Automatically categorizes and tags incoming information"),
            ("Duplicate Detection System", "Flags redundant data across your second brain"),
        ],
    },
    {
        "num": "03", "key": "decide", "name": "Decide",
        "desc": "Prioritization, recommendations, and scoring",
        "css_class": "cat-decide",
        "folder": "03_decide",
        "coming_soon": [
            ("Daily Decision Engine", "Recommends what to do right now based on energy, priorities, and context"),
            ("Opportunity Scoring System", "Scores and ranks incoming opportunities against your goals"),
            ("Relationship Priority Engine", "Surfaces who to invest time in based on ROI and recency"),
        ],
    },
    {
        "num": "04", "key": "execute", "name": "Execute",
        "desc": "Action-oriented tools for getting things done",
        "css_class": "cat-execute",
        "folder": "04_execute",
        "coming_soon": [
            ("Deep Work Launcher", "Sets up focused work sessions with timers, blockers, and goals"),
            ("Social Action Generator", "Creates personalized outreach messages and follow-ups"),
            ("Content Production System", "Pipeline from idea to draft to published content"),
        ],
    },
    {
        "num": "05", "key": "feedback", "name": "Feedback",
        "desc": "Reflection, performance analysis, and learning loops",
        "css_class": "cat-feedback",
        "folder": "05_feedback",
        "coming_soon": [
            ("Daily Performance Analyzer", "End-of-day review comparing intentions vs actual output"),
            ("Weekly Review Dashboard", "Weekly retrospective across all life domains"),
            ("Energy vs Output Tracker", "Correlates energy levels with productivity over time"),
        ],
    },
    {
        "num": "06", "key": "strategy", "name": "Strategy",
        "desc": "Long-term thinking, identity, and direction",
        "css_class": "cat-strategy",
        "folder": "06_strategy",
        "coming_soon": [
            ("Life Direction Dashboard", "Maps values to goals to systems — your personal compass"),
            ("Capital Allocation Simulator", "Models where to invest time, money, and attention long-term"),
            ("Long-term Narrative Builder", "Tracks your evolving identity and life story over quarters"),
        ],
    },
]


def extract_title(filepath: Path) -> str:
    """Extract title from an HTML file via <title> tag, first <h1>, or filename."""
    try:
        text = filepath.read_text(encoding="utf-8", errors="ignore")[:4000]
    except Exception:
        return filepath.stem.replace("-", " ").replace("_", " ").title()

    # Try <title>
    m = re.search(r"<title[^>]*>(.*?)</title>", text, re.IGNORECASE | re.DOTALL)
    if m:
        title = re.sub(r"\s+", " ", m.group(1)).strip()
        if title:
            return title

    # Try first <h1>
    m = re.search(r"<h1[^>]*>(.*?)</h1>", text, re.IGNORECASE | re.DOTALL)
    if m:
        title = re.sub(r"<[^>]+>", "", m.group(1)).strip()
        if title:
            return title

    return filepath.stem.replace("-", " ").replace("_", " ").title()


def scan_apps(folder: Path):
    """Find all .html files recursively, excluding index.html at root level of each folder."""
    apps = []
    if not folder.exists():
        return apps
    for f in sorted(folder.rglob("*.html")):
        rel = f.relative_to(BASE_DIR)
        apps.append({"title": extract_title(f), "path": str(rel)})
    return apps


def escape_html(s: str) -> str:
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")


def build_html(categories_data: list, total_apps: int, total_planned: int) -> str:
    today = date.today().isoformat()

    sections = []
    for cat in categories_data:
        cards_html = []
        for app in cat["apps"]:
            cards_html.append(
                f'      <a class="card" href="{escape_html(app["path"])}">\n'
                f'        <div class="card-title">{escape_html(app["title"])}</div>\n'
                f'        <div class="card-path">{escape_html(app["path"])}</div>\n'
                f'      </a>'
            )
        for name, desc in cat["coming_soon"]:
            cards_html.append(
                f'      <div class="card coming-soon">\n'
                f'        <span class="badge">Coming Soon</span>\n'
                f'        <div class="card-title">{escape_html(name)}</div>\n'
                f'        <div class="card-desc">{escape_html(desc)}</div>\n'
                f'      </div>'
            )

        sections.append(
            f'  <div class="category {cat["css_class"]}" data-cat="{cat["key"]}">\n'
            f'    <div class="cat-header">\n'
            f'      <span class="cat-number">{cat["num"]}</span>\n'
            f'      <span class="cat-title">{escape_html(cat["name"])}</span>\n'
            f'      <span class="cat-desc">{escape_html(cat["desc"])}</span>\n'
            f'    </div>\n'
            f'    <div class="cards">\n'
            + "\n".join(cards_html) + "\n"
            f'    </div>\n'
            f'  </div>'
        )

    sections_block = "\n\n".join(sections)

    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Claude OS — Second Brain Dashboard</title>
<style>
  :root {{
    --bg: #f5f2ed;
    --surface: #eee9e2;
    --border: #d5cec4;
    --border-light: #e2dbd2;
    --text: #2c2825;
    --text-secondary: #6b6259;
    --text-tertiary: #9c9389;
    --text-faint: #b8b0a5;
    --accent: #5c5347;
  }}
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
    background: var(--bg); color: var(--text); min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }}
  .header {{
    text-align: center; padding: 72px 24px 48px;
    border-bottom: 1px solid var(--border);
  }}
  .header h1 {{
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 15px; font-weight: 400; letter-spacing: 6px;
    text-transform: uppercase; color: var(--text); margin-bottom: 12px;
  }}
  .header h1 span {{ color: var(--text); }}
  .header .subtitle {{
    font-family: Georgia, 'Times New Roman', serif;
    color: var(--text-tertiary); font-size: 13px; font-weight: 400;
    font-style: italic; letter-spacing: 0.5px;
  }}
  .meta-bar {{
    display: flex; justify-content: center; gap: 32px; margin-top: 28px;
    padding-top: 20px; border-top: 1px solid var(--border-light);
    font-size: 10px; color: var(--text-faint); text-transform: uppercase; letter-spacing: 2px;
  }}
  .meta-bar span strong {{ color: var(--text-secondary); font-weight: 500; }}
  .search-wrap {{ display: flex; justify-content: center; padding: 36px 24px 12px; }}
  .search-wrap input {{
    width: 100%; max-width: 400px; padding: 10px 0;
    border: none; border-bottom: 1px solid var(--border);
    background: transparent; color: var(--text);
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 14px; font-style: italic; outline: none;
    transition: border-color 0.3s; text-align: center; letter-spacing: 0.5px;
  }}
  .search-wrap input::placeholder {{ color: var(--text-faint); font-style: italic; }}
  .search-wrap input:focus {{ border-bottom-color: var(--accent); }}
  .dashboard {{ max-width: 880px; margin: 0 auto; padding: 24px 24px 96px; }}
  .category {{ margin-bottom: 64px; }}
  .category.hidden {{ display: none; }}
  .cat-header {{
    display: flex; align-items: baseline; gap: 14px; margin-bottom: 28px;
    padding-bottom: 14px; border-bottom: 1px solid var(--border);
  }}
  .cat-number {{
    font-size: 10px; font-weight: 400; letter-spacing: 2px;
    color: var(--text-faint); background: none; padding: 0;
  }}
  .cat-input .cat-number, .cat-organize .cat-number, .cat-decide .cat-number,
  .cat-execute .cat-number, .cat-feedback .cat-number, .cat-strategy .cat-number {{
    background: none; color: var(--text-faint);
  }}
  .cat-title {{
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 20px; font-weight: 400; letter-spacing: 3px; text-transform: uppercase;
    color: var(--text);
  }}
  .cat-desc {{
    color: var(--text-tertiary); font-size: 12px; font-style: italic;
    margin-left: auto; letter-spacing: 0.3px;
  }}
  .cards {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }}
  .card {{
    background: transparent; border: none; border-bottom: 1px solid var(--border-light);
    border-radius: 0; padding: 20px 4px; text-decoration: none; color: var(--text);
    transition: border-color 0.3s; display: flex; flex-direction: column; gap: 8px;
  }}
  .card:hover {{ border-bottom-color: var(--accent); background: transparent; transform: none; }}
  .card-title {{
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 15px; font-weight: 400; line-height: 1.5; color: var(--text);
  }}
  .card-path {{
    font-size: 10px; color: var(--text-faint);
    font-family: 'SF Mono', 'Fira Code', 'Courier New', monospace;
    word-break: break-all; letter-spacing: 0.3px;
  }}
  .card.coming-soon {{
    border-style: none; border-bottom: 1px solid var(--border-light);
    background: transparent; cursor: default; opacity: 1;
  }}
  .card.coming-soon:hover {{ transform: none; border-bottom-color: var(--border-light); background: transparent; }}
  .card.coming-soon .card-title {{ color: var(--text-faint); font-style: italic; }}
  .card.coming-soon .card-desc {{ font-size: 11px; color: var(--text-faint); font-style: italic; line-height: 1.6; }}
  .badge {{
    display: inline-block; font-family: 'Inter', -apple-system, sans-serif;
    font-size: 8px; text-transform: uppercase; letter-spacing: 2px;
    padding: 0; border-radius: 0; background: none; color: var(--text-faint);
    font-weight: 400; width: fit-content;
  }}
  .no-results {{
    text-align: center; padding: 64px 24px; color: var(--text-tertiary);
    font-family: Georgia, 'Times New Roman', serif; font-size: 14px;
    font-style: italic; display: none;
  }}
  @media (max-width: 600px) {{
    .cards {{ grid-template-columns: 1fr; }}
    .cat-desc {{ display: none; }}
    .header {{ padding: 48px 20px 36px; }}
    .header h1 {{ font-size: 13px; letter-spacing: 5px; }}
    .dashboard {{ padding: 16px 20px 64px; }}
    .category {{ margin-bottom: 48px; }}
  }}
</style>
</head>
<body>
<div class="header">
  <h1>Claude <span>OS</span></h1>
  <div class="subtitle">Second Brain Operating System</div>
  <div class="meta-bar">
    <span><strong>{total_apps}</strong> apps built</span>
    <span><strong>{total_planned}</strong> planned</span>
    <span>Generated <strong>{today}</strong></span>
  </div>
</div>
<div class="search-wrap">
  <input type="text" id="search" placeholder="Search apps..." autocomplete="off">
</div>
<div class="dashboard">

{sections_block}

</div>
<div class="no-results" id="no-results">No apps match your search.</div>
<script>
  const search = document.getElementById('search');
  const categories = document.querySelectorAll('.category');
  const noResults = document.getElementById('no-results');
  search.addEventListener('input', () => {{
    const q = search.value.toLowerCase().trim();
    let anyVisible = false;
    categories.forEach(cat => {{
      const cards = cat.querySelectorAll('.card');
      let catVisible = false;
      cards.forEach(card => {{
        const text = card.textContent.toLowerCase();
        const match = !q || text.includes(q);
        card.style.display = match ? '' : 'none';
        if (match) catVisible = true;
      }});
      cat.classList.toggle('hidden', !catVisible);
      if (catVisible) anyVisible = true;
    }});
    noResults.style.display = anyVisible ? 'none' : 'block';
  }});
</script>
</body>
</html>'''


def main():
    total_apps = 0
    total_planned = 0
    categories_data = []

    print("Claude OS — Dashboard Generator")
    print("=" * 40)

    for cat in CATEGORIES:
        folder = BASE_DIR / cat["folder"]
        apps = scan_apps(folder)
        n_apps = len(apps)
        n_planned = len(cat["coming_soon"])
        total_apps += n_apps
        total_planned += n_planned

        categories_data.append({**cat, "apps": apps})
        print(f"  {cat['num']} {cat['name']:<12} {n_apps} apps   {n_planned} planned")

    print("-" * 40)
    print(f"  Total:        {total_apps} apps   {total_planned} planned")
    print()

    html = build_html(categories_data, total_apps, total_planned)
    out = BASE_DIR / "index.html"
    out.write_text(html, encoding="utf-8")
    print(f"  Written to: {out}")
    print("  Done.")


if __name__ == "__main__":
    main()
