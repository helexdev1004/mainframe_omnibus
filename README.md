# mainframe — omnibus homepage

Marketing homepage for the mainframe omnibus platform, built with Next.js 16 (App Router), React 19, Tailwind CSS 4 and three.js.

This is the visual homepage only. Buttons, log in, booking and the language switcher are not wired up yet.

## Run it

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # serve the production build
```

## Deploying

Every push to `main` publishes the site to GitHub Pages through `.github/workflows/deploy.yml`. The workflow builds a static export (`out/`) with the repository name as the base path; `next.config.ts` only switches to that mode when the workflow's `GITHUB_PAGES` variable is set, so local development is unaffected.

Pages has to be enabled once per repository: Settings → Pages → Source → GitHub Actions.

## Layout of the code

| Path | What it holds |
| --- | --- |
| `src/app` | Root layout, fonts, global styles and the page |
| `src/components` | One file per page section: `Header`, `Hero`, `UpcomingWaves`, `HowItWorks`, `Markets`, `WhyMainframe`, `CallToAction`, `Footer` |
| `src/components/globe` | The hero globe (see below) |
| `src/data` | Generated dot masks for the globe and the Europe map |
| `scripts/generate-geo.mjs` | Builds `src/data` from Natural Earth country shapes |
| `public/brand` | Logo files |

## The globe

`GlobeCanvas.tsx` owns the behaviour: the intro, rotation with inertia, dragging, scroll response and the ripples that leave each market. Every frame it hands that state to one of two renderers that draw the same scene:

- `renderWebGL.ts` uses three.js and is loaded only when the browser has a real GPU.
- `renderCanvas2d.ts` draws on the CPU. It is used on machines without a GPU (virtual machines, remote desktops), where emulated WebGL is too slow.

The glass sphere and its glow never change as the globe turns, so `plate.ts` renders them once into a still image that sits under the live canvas.

`config.ts` holds what both renderers share: camera, markets, orbit rings and timings. The maths in `shaders.ts` and `renderCanvas2d.ts` mirror each other, so a visual change needs making in both.

## Keeping it sharp

Text is never placed on a rotated or perspective-transformed element: browsers rasterise such elements and resample them, which leaves text soft, most visibly on machines without a GPU. The 3D artwork in "How it works" is therefore vector SVG, drawn with the small isometric kit in `src/components/iso.tsx`, and the country shapes in "Upcoming waves" are SVG dots built from `src/data/europe.json`.

Animations that finish (`.reveal`, `.fade-up`) leave no transform or `will-change` behind, for the same reason.

## Changing markets or dot density

The six markets are listed in three places: `scripts/generate-geo.mjs` (map data), `src/components/globe/config.ts` (capitals on the globe) and `src/components/Markets.tsx` (the chips). After editing the script, regenerate the data and commit the result:

```bash
npm run geo
```
