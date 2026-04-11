# Idea Capture

Personal throughput engine. Converts dead time into structured, routed action.

## Repo Structure

```
repo/
  app-source/          <- EDIT HERE (source of truth)
    index.html         <- the app
    VERSION            <- current version number
  docs/                <- DEPLOYED HERE (GitHub Pages serves this)
    index.html         <- production copy (do not edit directly)
  deploy.sh            <- copies app-source/ -> docs/
  01_input/            <- other project apps
  02_organize/
  03_decide/
  04_execute/
  05_feedback/
  06_strategy/
```

## Where to Edit

**Always edit `app-source/index.html`.**

Never edit `docs/index.html` directly. It gets overwritten by `deploy.sh`.

## How to Deploy

```bash
# 1. Edit app-source/index.html
# 2. Test locally (open in browser)
open app-source/index.html

# 3. Deploy to docs/
./deploy.sh

# 4. Verify production copy
open docs/index.html

# 5. Commit and push
git add docs/ app-source/
git commit -m "deploy v1.5.0"
git push
```

## GitHub Pages Settings

Configure in your GitHub repo settings:

- **Source:** Deploy from a branch
- **Branch:** `main`
- **Folder:** `/docs`

The live site will serve `docs/index.html`.

## Version Tracking

Bump the version in `app-source/VERSION` before deploying.

The deploy script reads this file and prints the version during deploy.

## Safe Update Process

1. Edit `app-source/index.html`
2. Open it locally in your browser to test
3. Run `./deploy.sh` to copy into `docs/`
4. Open `docs/index.html` to verify the production copy
5. `git add docs/ app-source/`
6. `git commit -m "deploy vX.Y.Z"`
7. `git push`
8. Wait 1-2 minutes for GitHub Pages to update

## What NOT to Do

- Do not edit `docs/index.html` directly
- Do not rename `docs/index.html`
- Do not add multiple HTML files to `docs/`
- Do not change GitHub Pages to serve from a different folder

## App Details

Single-file HTML app with embedded CSS and JS. No build step. No dependencies. Uses localStorage for persistence.

The app lives at one stable path: `docs/index.html`
