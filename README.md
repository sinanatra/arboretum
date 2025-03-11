# Harvard Arboretum

## Developing

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

You can preview the production build with `npm run preview`.

Deploy with:

```bash
npm run deploy
```


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