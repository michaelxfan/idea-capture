---
name: routine-meals
description: Manages a personal meal log at ~/meal-tracker/ that captures how you actually cook (the Good version) alongside how each dish could be elevated with chef-level technique (the Best version). Use this skill whenever the user wants to log a meal, add a meal to their routine, update or delete a meal entry, or view their Good vs Best meal dashboard. Triggers on phrases like "log a meal", "add to my routine meals", "show my good vs best meals", "update my meal", "delete a meal from my log", "open my meal dashboard", "meal log", "track a meal", "what's my best version of X", or anything involving comparing how they cook something vs. how it could be cooked better.
---

# Routine Meals

You help the user maintain a personal meal tracker that captures how they *actually* cook (the **Good** version) alongside how each dish *could* be elevated with chef-level technique (the **Best** version). After every change, you regenerate a visual dashboard and open it in the browser automatically.

## File locations

- **Meal data**: `~/meal-tracker/meals.json`
- **Dashboard**: `~/meal-tracker/dashboard.html`

Create `~/meal-tracker/` if it doesn't exist yet: `mkdir -p ~/meal-tracker/`

---

## meals.json schema

```json
{
  "meals": [
    {
      "id": "kebab-case-meal-name",
      "name": "Instant Pot Beef Stew",
      "category": "dinner",
      "cuisine": "American",
      "date_logged": "2026-03-30",
      "good": {
        "ingredients": ["beef chunks", "potatoes", "carrots", "beef broth", "onion"],
        "method": "Threw everything in Instant Pot, pressure cooked 35 min"
      },
      "best": {
        "ingredients": [
          "chuck roast, cut into 2-inch cubes",
          "Yukon Gold potatoes",
          "carrots",
          "homemade or high-quality beef stock",
          "pearl onions",
          "fresh thyme + bay leaves",
          "1/2 cup dry red wine"
        ],
        "method": "Pat beef dry and sear in batches in a hot pan until deeply browned on all sides. Deglaze with red wine, scraping up fond. Add aromatics and stock. Pressure cook 35 min. Finish by swirling in 1 tbsp cold butter off heat.",
        "why_better": [
          "Searing creates a Maillard crust — this caramelisation adds dozens of new flavour compounds absent from the boiled version",
          "Chuck roast has abundant intramuscular fat that renders under pressure, keeping every bite tender and self-basting",
          "Deglazing lifts the fond (browned bits = concentrated flavour) and the wine's acidity balances the richness of the beef"
        ]
      }
    }
  ]
}
```

- `id`: kebab-case version of the name (e.g. `"instant-pot-beef-stew"`)
- `category`: one of `breakfast`, `lunch`, `dinner`, `snack`
- `date_logged`: ISO date (`YYYY-MM-DD`), default to today

---

## Operations

### Add a meal

1. Ask the user for: meal name, category, cuisine type, ingredients list, and method. These can be casual — clean them up but preserve the voice.
2. If the user doesn't provide a Best version, generate one (see **Auto-generating the Best version** below).
3. Use today's date for `date_logged`.
4. Read `meals.json` (or start with `{"meals": []}` if it doesn't exist), append the new entry, write it back.
5. Regenerate the dashboard, then open it: `open ~/meal-tracker/dashboard.html`

### Update a meal

1. Find the meal by name — fuzzy match is fine; if ambiguous, list candidates and ask.
2. Ask which fields to change, or accept the new values from the user's message directly.
3. If the Good version changed but no new Best is provided, regenerate the Best version from scratch.
4. Write updated `meals.json`, regenerate dashboard, open in browser.

### Delete a meal

1. Confirm the meal name with the user before deleting (show the full name so there's no mistake).
2. Remove from the `meals` array, write `meals.json`, regenerate dashboard, open in browser.

### View dashboard

Just open the file: `open ~/meal-tracker/dashboard.html`

If the file doesn't exist yet (no meals logged), say so and offer to log the first one.

---

## Auto-generating the Best version

When the user gives you a Good version but no Best version, your job is to be a knowledgeable culinary guide — not a restaurant chef, but someone who deeply understands *why* techniques work and can explain it in plain language.

**How to elevate:**

- **Ingredients**: Replace generic items with specific, higher-quality equivalents that a home cook can actually find.
  - "beef" → "chuck roast, cut into 2-inch cubes" (better fat marbling)
  - "oil" → "clarified butter or avocado oil" (higher smoke point)
  - "canned tomatoes" → "San Marzano DOP whole tomatoes, crushed by hand"
  - "garlic powder" → "4 cloves fresh garlic, thinly sliced"

- **Technique**: Add steps that build flavour layers the Good version skips.
  - Sear proteins before liquid cooking (Maillard reaction)
  - Bloom spices in fat before adding liquid
  - Deglaze to capture fond
  - Salt ahead of time (dry brine effect)
  - Rest meat before cutting

- **Sequencing**: Reorder steps to follow culinary logic — aromatics before protein, acid added at the right moment, heat adjusted for each phase.

**Why better (2–3 bullets):** Each bullet should name the specific technique, explain the mechanism briefly, and make clear what the cook gains. Be precise, not generic.

Good example: *"Blooming cumin in hot fat releases fat-soluble aroma compounds — you get roughly 3× the flavour vs. stirring it in dry with the liquid"*

Weak example: *"Using better ingredients makes it taste nicer"*

The Best version must be achievable at home without specialist equipment. Avoid sous vide, liquid nitrogen, or commercial kitchen tools unless the user explicitly mentions having them.

---

## Regenerating the dashboard

After every add, update, or delete, write a complete, self-contained `~/meal-tracker/dashboard.html`. Requirements:

- **Works by double-click** — no server, no external CDN, no JS frameworks. Pure HTML + CSS + inline JS only.
- **Sort meals** newest-first by `date_logged`.
- **Each meal** is rendered as a card with a header row and a two-column side-by-side layout:
  - Left column: **Good** version — light gray card (`background: #f3f4f6`, left border `4px solid #6b7280`)
  - Right column: **Best** version — light green card (`background: #f0fdf4`, left border `4px solid #16a34a`)
- **Card structure:**
  - Header: meal name (bold, large), category badge (pill shape), cuisine type (muted text), date logged (muted text, right-aligned)
  - Each version panel: version label ("Good" / "Best") as a small uppercase heading, ingredients as a `<ul>`, method as a `<p>`
  - Best panel only: a "Why it's better" section with each bullet in a highlighted green `<li>` (use a ✦ or ► prefix or a subtle green background)
- **Page header:** "My Meal Tracker" title + a small count of total meals logged.
- **Responsive:** cards stack vertically on narrow screens (use flexbox with `flex-wrap: wrap`).

Write the full HTML from scratch each time — embed all meal data directly in the file. Do not reference any external files or URLs.

After writing the file, run: `open ~/meal-tracker/dashboard.html`
