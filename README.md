# Nick Freiburger — Portfolio

Personal portfolio of **Nick Freiburger**, UX/UI & graphic designer based in Knoxville, Tennessee.
Six case studies (OhYum!, The Net VR, Nantucket Bakery, Counter Solutions, Bridging Health Equity, Cinematica), an About page built from my résumé, and a contact section.

## What's inside

```
index.html                  Home: hero, selected work, about teaser
about/index.html            About: intro, experience, education, toolkit
work/<project>/index.html   One page per case study
404.html                    Not-found page (GitHub Pages serves it automatically)
assets/css/style.css        Design system: dark by default, light theme via the toggle
assets/js/main.js           Theme toggle, lightbox, galleries, table of contents, Figma prototype loader
assets/img/<project>/       Case study images (optimized WebP)
assets/favicon.svg
assets/Nicholas_Freiburger_Resume.pdf
```

It's plain HTML, CSS and JavaScript: no framework and no build step. To change copy, open the relevant `index.html` and edit the text directly. Shared styles live in `assets/css/style.css`; colors, type and spacing are defined as CSS variables at the top of that file.

## Preview locally

Any static file server works. From this folder, for example:

```bash
npx serve .
```

Then open the URL it prints. (Opening the HTML files directly also works, but folder links like `about/` behave best through a server.)

## Hosting on GitHub Pages

1. Repository **Settings → Pages**.
2. **Source:** Deploy from a branch. **Branch:** `main`, folder `/ (root)`.
3. The site is published at `https://<username>.github.io/<repository>/` within a minute or two.


## Credits

Typefaces: [Geist and Geist Mono](https://vercel.com/font) via Google Fonts. Prototypes are embedded from Figma.

All content, case studies and images © Nick Freiburger. All rights reserved.
