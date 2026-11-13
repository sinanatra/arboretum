# Harvard Arboretum

App repository: [`sinanatra/arboretum`](https://github.com/sinanatra/arboretum).
`main` contains the current app and is the active development branch.

## Data

The plant, curator and attribution datasets are built in the private
`rodighiero/arboretum-data` repo. Clone it beside this checkout as
`../arboretum-data`. `static/data/` is git-ignored and contains only a local
copy of the three JSON files the website reads. Don't edit them here.
After rebuilding and committing there, refresh the local copy with:

```bash
npm run sync:data   # from ../arboretum-data; pass another path after --
```

`static/data/source.json` records the source commit and checksums, and
`npm test` fails if the copy has been edited. Development and production
builds sync automatically and require the data checkout. To use another
location for automatic syncing, set `ARBORETUM_DATA_DIR=/path/to/arboretum-data`.
The data repository is the source of truth. The published `docs/data/`
folder contains a committed snapshot of the JSON needed by the browser;
rebuild the app to refresh it. The pipeline and raw inputs stay separate.

## Developing

The map background is prepared automatically before `npm run dev` and
`npm run build`. To regenerate it separately, run `npm run prepare:map`.
This creates `static/map/render.json` from the original map geometry; do not
edit the generated file by hand. Verify it with
`npm test`.

Install dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building and publishing

Build the working website into `docs/`:

```bash
npm run build
npm run preview
```

Production builds default to the GitHub Pages path `/arboretum`.
Override it with `BASE_PATH` when publishing somewhere else.
The build syncs the committed outputs from `../arboretum-data`, prepares
map geometry, and replaces `docs/`. Do not edit generated files in `docs/`.

Commit and push `docs/` together with the source changes to publish an update:

```bash
git add docs
git commit -m "Update published website"
git push origin main
```

GitHub Pages should use **Deploy from a branch**, branch **main**, folder
**/docs**. `docs/.nojekyll` preserves the generated `_app` assets.
The generated JSON is public and versioned as part of the published website.


```
# export the data from OSM
[out:json][timeout:25];
(
  // Main roads: primary, secondary, tertiary
  way["highway"~"^(primary|secondary|tertiary)$"]({{bbox}});
  
  // Local roads: residential, unclassified, living_street
  way["highway"~"^(residential|unclassified|living_street|service)$"]({{bbox}});
 
    way["leisure"="park"]({{bbox}});
  relation["leisure"="park"]({{bbox}});
  
  // Ponds (water bodies tagged as ponds)
  way["natural"="water"]["water"="pond"]({{bbox}});
  relation["natural"="water"]["water"="pond"]({{bbox}});
  
  // Rivers
  way["waterway"="river"]({{bbox}});
  
  // Trainlines
  way["railway"="rail"]({{bbox}});

);
out body;
>;
out skel qt;


```
