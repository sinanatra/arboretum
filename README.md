# Harvard Arboretum

App repository: [`sinanatra/arboretum`](https://github.com/sinanatra/arboretum).
`main` contains the current app; `dev` remains available for development.

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
Only the data repository versions the outputs; the app has no second
committed copy. Built website assets include the JSON needed by the browser.

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

## Building

To create a production version of your app:

```bash
npm run build
```

For GitHub Pages hosted under `/arboretum`, build with that base path:

```bash
BASE_PATH=/arboretum npm run build
```

You can preview the production build with `npm run preview`.

The existing `gh-pages` branch contains the legacy published site. Publishing
a new build makes its JSON assets public. Use a Pages artifact deployment
for future builds so generated datasets stay out of Git history.


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
