# Raza — Personal Portfolio

A project-focused portfolio for myself.

**Live site:** [razabuilds.dev](https://www.razabuilds.dev/)

## What this demonstrates

- A responsive, accessible portfolio built with semantic HTML, CSS, and vanilla JavaScript
- A dynamic neural-network-inspired background and interactive project visualizations
- Motion controls with full, calm, and off modes
- Full-motion cursor choreography: six builders, six phrase writers, and an idle pointer swarm; four cursors on compact layouts
- Project storytelling designed for internship applications
- A five-project viewer with keyboard navigation, direct project links, and selection that stays in sync with the displayed project
- A one-time cursor assembly for the PROJECTS heading and interactive illustrations matched to the site's palette
- Mobile layouts and touch-friendly interactions

## Featured projects

- Depth estimation and SLAM
- ML inference systems
- A decoder-only transformer built from scratch in PyTorch
- A full-stack car-rental application
- Bias and fairness evaluation across Phi-2, StableLM-3B, and TinyLlama

## Project structure

```text
dist/
  index.html        Page structure and portfolio content
  cinematic.css     Responsive visual system and project layouts
  style.css         Earlier visual system, retained for reference
  work.css          Earlier project styles, retained for reference
  app.js            Page interactions
  neural.js         Animated network background
  builders.js       Cursor choreography and section assembly
  builders.css      Decorative cursors and construction outlines
  work.js           Project selection and interactive demonstrations
  viewer.css        Single-project viewer and responsive selector
  assets/           Fonts, icons, and project illustrations
```

## Run locally

Serve the `dist` directory with any static web server. For example:

```bash
npx serve dist
```

Then open the local address printed in the terminal.

## Design goals

The site uses a dark, technical visual language. Its motion and interactive diagrams are interactive and reduced-motion options keep the experience comfortable and accessible.

## Author

[Syed Raza](https://github.com/Razarex-512) · [LinkedIn](https://ca.linkedin.com/in/syed-muhammad-mehdi-raza)
