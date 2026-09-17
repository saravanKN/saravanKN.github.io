# Saravanan Kumar Portfolio

A dependency-free, responsive static portfolio.

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

Open `index.html` locally to preview it.

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
