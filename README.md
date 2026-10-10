# Saravanan Kumar Portfolio

A dependency-free, responsive static portfolio with a bright visual design, an animated data-flow hero with a cursor-responsive particle field, illustrated project cards, expandable experience, and keyboard-accessible mobile navigation.

The sun/moon switch in the header changes between light and dark mode. The site remembers explicit choices, defaults to the device preference, and follows device appearance changes until a visitor chooses a mode.

Decorative animations respect reduced-motion preferences and can also be paused using the control above the technology strip. All core content and document links remain available without JavaScript.

Project illustrations include small, explicitly illustrative demos: send a data event, inspect recommendation signals, and explore chatbot intents. The architecture diagram supports keyboard and touch exploration and a sample event walkthrough. A shared, capped canvas loop paints local data flows and short cursor sparkles; it stops when hidden, offscreen, paused, or reduced motion is requested. Static artwork remains available when canvas is unsupported.

## Project structure

```
portfolio-site/
├── assets/
│   ├── documents/
│   │   ├── certificates/       # Linked certificate PDFs
│   │   └── resume/             # Downloadable resume
│   └── images/                 # Portrait and company marks
├── scripts/
│   └── main.js                 # Navigation, toggles, and scroll progress
├── styles/
│   └── main.css                # Responsive visual system
├── index.html                  # Static application entry point
└── README.md
```

Open `index.html` locally to preview it, or serve the repository with `python3 -m http.server 8765` and visit `http://localhost:8765`.

## Deploy

### GitHub Pages

Create a repository, commit the contents of this `portfolio-site` directory, then enable **Settings → Pages → Deploy from a branch** and select the branch root.

### Cloudflare Pages

Create a Pages project from the repository. Use no build command and set the output directory to `/`.

### Vercel

Import the repository as an **Other** project. Leave the build command empty and set the output directory to `.`.

### Netlify

Import the repository. Leave the build command empty and set the publish directory to `.`.

Keep the `assets` directory with the site during deployment so resume, certificate, and image links continue to work.
