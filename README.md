kholdstare.github.com
=====================

A blog website about my coding projects and other interests

## How this site is put together

I started this many years ago, and by now have forgotten the technologies I
cobbled together back then to get everything to work. The goal was Markdown or
bust, for posts and presentations. Here are the details so I don't forget the
next time I need to tweak something.

- Update ruby jems
  - Run `bundle install`
- Jekyll for static site generation
  - To preview locally run `bundle exec jekyll serve --drafts --incremental`
  - The generation step is run by github pages automatically
- Design/styling
  - Customized Zurb Foundation v3 (ancient I know) sass sylesheets
  - To regenerate css from sass live run `bundle exec compass watch`
- Presentations
  - Imported as a submodule from my `presentations` repository
  - Uses pandoc and reveal.js
  - Run `make` in root dir to generate html and pdf of presentations
- Diagrams
  - Dia to draw diagrams and generate `.svg`s and `.png`s
  - See `diagrams_src` directory for the `.dia` files
  - Run `make` in root dir to generate the images
  - Will use [diagrams.net](draw.io aka diagrams.net) going forward, to generate `.svg`s
  - [https://www.diagrams.net/blog/mermaid-diagrams](Mermaid syntax looks interesting)

## TODO

- Fix sass -> css generation (looks like using foundation v3)
- Consider upgrading foundation to v6? This will most likely mean a complete re-design :facepalm:
