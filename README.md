# Online Mentorship Program 🚀

The official website for the **Online Mentorship Program**, powered by **MT Software Solutions & Academy** and led by **Eng. Mohamed Tamer**.

[![Status: Active](https://img.shields.io/badge/status-active-brightgreen)](https://mtacademy-mentor.github.io/)
[![Languages: Arabic and English](https://img.shields.io/badge/languages-Arabic%20%7C%20English-blue)](#features)
[![License: Apache 2.0](https://img.shields.io/badge/license-Apache%202.0-orange)](LICENSE)

[View the live website](https://mtacademy-mentor.github.io/)

## Overview

This responsive, bilingual website introduces the mentorship program, its services and plans, the mentor's background, and testimonials from previous mentees. Visitors can explore the program in Arabic or English and contact the mentor directly through WhatsApp.

## Features

- Arabic (RTL) and English (LTR) content with a persistent language preference
- Responsive layouts for desktop, tablet, and mobile screens
- Mentorship services and subscription-plan comparisons
- Mentee testimonials, achievements, and program statistics
- Animated content reveals and interactive testimonial sliders
- Direct booking and contact links through WhatsApp
- Links to the mentor's courses, profiles, and community channels

## Program at a Glance

- **127+** mentees
- **13+** countries reached
- **22K** Udemy students
- **7+** years of software engineering experience

## Built With

- Semantic HTML5
- CSS3 with custom properties, responsive breakpoints, and animations
- Vanilla JavaScript for language switching, navigation, scroll effects, and sliders
- [Font Awesome 6](https://fontawesome.com/) for icons
- [Google Fonts](https://fonts.google.com/) using Cairo and Playfair Display

No build step or package installation is required.

## Project Structure

```text
.
├── assets/
│   └── images/         # Branding, mentor photos, reviews, flags, and payment logos
├── css/
│   └── style.css       # Design system, layouts, animations, and responsive styles
├── js/
│   └── script.js       # Language, navigation, reveal, and slider interactions
├── index.html          # Main bilingual page
├── LICENSE             # Apache License 2.0
└── README.md
```

## Run Locally

1. Clone the repository:

   ```bash
   git clone https://github.com/mtacademy-mentor/mtacademy-mentor.github.io.git
   cd mtacademy-mentor.github.io
   ```

2. Start a local static server:

   ```bash
   python3 -m http.server 8000
   ```

3. Open [http://localhost:8000](http://localhost:8000) in your browser.

You can also open `index.html` directly, but a local server more closely matches the deployed environment. An internet connection is needed to load externally hosted fonts, icons, and the Udemy logo.

## Making Changes

- Update page content and links in `index.html`.
- Adjust colors, spacing, typography, and responsive behavior in `css/style.css`.
- Update language, navigation, reveal, or slider behavior in `js/script.js`.
- Add or replace images under `assets/images/` and keep their paths in `index.html` in sync.

After making changes, check both languages and test the page at desktop and mobile widths.

## Deployment

The project is a static site designed for GitHub Pages. Changes published from the repository's configured Pages branch are available at [mtacademy-mentor.github.io](https://mtacademy-mentor.github.io/).

## License

Licensed under the [Apache License 2.0](LICENSE).

<p align="center">
  Made by <a href="https://github.com/mtacademy-mentor">MT Software Solutions &amp; Academy</a>
</p>
