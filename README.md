# Rock Papers Scissors — website

Five pages with a live space scene: warp-speed intro, 3D low-poly asteroids, the paper satellite,
a scissors fly-by, and a smooth content swap between pages. Plain HTML, CSS and JavaScript.
No build step, no libraries.

## Pages
- `index.html`: home: intro, SERVICES (11 services scrolling sideways, each with its own artifact), OUR WORK (18 brands scrolling sideways), the brand orbit, process, contact
- `services.html`: the 11 services grouped by carve / draw / cut, plus ways to work together
- `work.html`: the brands, filterable by industry
- `work-<brand>.html`: one page per brand
- `about.html`: the story behind the name, the founder's quote, how you work, the studio
- `contact.html`: the brief form, contact details, what happens next and FAQs

## Files
- `css/style.css`: every style. Colours and fonts are the variables in `:root` at the top.
- `js/space.js`: the space scene, intro, scroll effects and the animation between pages
- `js/ui.js`: header, mobile menu, moving between pages without reloading, work filters and case studies, contact form, copy buttons, the sideways strips
- `assets/`: the low-poly characters (Roman statue from the future, astronaut, the three cavemen and the wheel, the spacewalker's two walking frames)
- `favicon.svg`: browser tab icon
- `manifest.webmanifest`, `sw.js`, `icons/`: the installable app (see below)

## Colour balance
About 30% fire red, 30% ivory, 25% steel "ion", the rest deep black.
- Red: "reality.", every Start button, section labels, the timeline, the orbit, the scissors, full stops after carve / draw / cut, and one side of every asteroid.
- Ivory: headlines, body text, secondary buttons.
- Steel: tags, data, icons and the cool side of the scene.

## See it on your computer
Double-click `index.html` (you need to be online for the fonts).

## Put it online
Upload the whole folder to any static host:
- **Netlify Drop**: open app.netlify.com/drop and drag this folder onto the page.
- **Hostinger, GoDaddy or cPanel**: upload the folder's contents into `public_html`.
- **Vercel or GitHub Pages**: create a project from the folder, no settings needed.
Then point rockpapersscissors.in at it.

## Phones and the app (Android + iPhone)
The same site works identically on Android (Chrome, Samsung Internet) and iPhone (Safari):
- Lighter space scene on phones (fewer stars and rocks) so it stays smooth on mid-range Android phones.
- No jumping when the browser toolbar hides while scrolling; the sideways sections stay pinned.
- Touch-friendly: no sticky hover effects, press feedback on buttons and cards, fields don't zoom on iPhone.
- Respects the notch and the home bar on iPhones.

It is also installable as an app, with the red "rps" icon and a full-screen launch:
- **Android**: open the site in Chrome, tap the menu, then "Install the RPS app" (or Chrome's own install banner).
- **iPhone**: open the site in Safari, tap Share, then "Add to Home Screen". The menu shows this hint on iPhones.
- Files: `manifest.webmanifest` (app name, colours, icons), `icons/` (app icons), `sw.js` (offline support).
- Installing only works once the site is live on **https** (Netlify, Vercel and most hosts do this automatically).
- When you upload a new version, change `VERSION` at the top of `sw.js` (for example `rps-v2`) so installed apps refresh.

## Contact form
Open `contact.html` and find `window.RPS_CONFIG` near the top.
- Leave `formEndpoint` empty and the form opens the visitor's email app with the brief filled in, addressed to info@rockpapersscissors.in. The visitor still has to press send, so briefs can be lost this way.
- Paste the web app address of the leads sheet into `formEndpoint` (it starts with `https://script.google.com/macros/s/` and ends with `/exec`) and every brief is added as a row to your Google Sheet and emailed to info@rockpapersscissors.in. The script for the sheet and the setup steps are in `RPS-leads-bridge-apps-script.txt`, kept outside the website folder.
- A Formspree, Getform or Basin address also works in `formEndpoint`; briefs then arrive in your inbox only.
- If sending to that address fails, the form falls back to opening the visitor's email app with the brief filled in, so the brief is not lost.

## Common edits
- **Text**: edit it directly in the page's HTML file. The header, menu and footer appear on every page, so change them in all five.
- **Brands**: brand names are set as typographic wordmarks. To use real logos, replace the `<span class="wm ...">` inside each card with an `<img>` of the logo (white version works best on the dark cards).
- **Services and artifacts**: each service card on the home page names its artifact (Kireedam, Vel, Gopuram...). Edit the names and lines directly in the HTML.
- **Call now**: the red phone button in the header dials +91 63620 12456 on phones. Change the `tel:` link in all five pages to use another number.
- **Asteroids / stars**: in `js/space.js`, `length: 16` in the `FIELD` line and `length: 950` in the `STARS` line.
- **Scissors fly-by gap**: the `% 15` in the fly-by block (seconds).

## Version 7 changes
- Opening title on the home page (about 12 seconds): an asteroid shower, a curtain of light, then ROCK / PAPERS / SCISSORS with "raw to reality." underneath. The three words then fly to the top-left and become the logo, with a red dot between each word. A "Skip intro" button (or Esc / Enter) jumps straight to the page. It is skipped when a visitor comes back to Home from another page; "Replay intro" in the footer plays it again. Timings live at the top of `js/space.js` (`BUILD`, `HANDOFF`) and in `updateIntro`.
- Logo is now rock · papers · scissors (three words, two red dots), about 30% bigger. Size: `--lh` on `.logo` in `css/style.css`.
- "raw to reality." headline is about 14% smaller; the red on every Start button is calmer (`--fire-btn`).
- The orbit around the hero stone now passes behind it: the far half and the little planet disappear behind the rock.
- Cursor is a small pair of scissors (mouse and trackpad only) that snips as it moves and leaves a quick cut where you click.
- Services and Our work: a pair of scissors rides the progress line and cuts it as you scroll, in step both ways.
- Our work: astronaut replaces the T-rex. Brand orbit: dragon removed, small satellites added between the rings, and every brand name set in the same font.
- Process: three cavemen tell the story: one carves a stone, one realises it's a wheel, one puts it to work.

## Version 8 changes
- Opening title: the diagonal asteroid shower is gone; the vertical light curtain stays.
- Services: the statue now stands beside the title, placed like the astronaut in Our work.
- Brand orbit: the planet in the middle no longer has "rps" written on it.
- Process: the three cavemen are spread across the full width of the page.
- Contact: the mummy is replaced by an astronaut spacewalking from left to right across the section. Speed: `16s` in the `.walker` rule in `css/style.css` (lower is faster).

## Version 9 changes
- Spacewalker: tethered by a cord to an unseen shuttle, hops across the contact section in low gravity and lands on the red line above the footer, again and again. Hop height and rhythm: the `hop` keyframes; crossing speed: `18s` in `.walker`.
- Clicking the logo on the home page plays the opening title again from the top, with the page, menu and buttons hidden until the name lands in the corner.

## Version 10 changes
- Name is now Rock Papers Scissors everywhere: page titles, text, logo (the middle word reads "papers"), opening title, app name and this file.
- Domain and email are rockpapersscissors.in and info@rockpapersscissors.in. Phone is +91 63620 12456 (text, Copy buttons and the "Call now" link).
- About page: founded 2 September 2026, team of six.
- Fixed: clicking the headline area on any page replaced the whole hero text with the word "Copy". The Copy-button script was also catching the hero text block, which shares the class name `copy`. It now only attaches to the real Copy buttons (`button.copy[data-copy]` in `js/ui.js`).

## Version 11 to 15 changes
- Moving between pages no longer reloads the site. The space scene, the header and the menu stay exactly as they are; only the page content is swapped. The old page's headline slides up and its text fades out, the stone glides to its place for the next page, and the new page's headline and text rise in one after another. The whole switch takes under a second. Timings: `EXIT` and `ENTER` near the top of `js/space.js`.
- How it works: `js/ui.js` fetches the next page in the background (all five pages are fetched quietly after the first one has loaded), takes its `<main>` and `<footer>`, and puts them in place of the current ones. The address bar, the page title, and the Back and Forward buttons all behave as usual. If a page cannot be fetched (for example when the site is opened straight from a folder by double-clicking), links work the ordinary way.
- Because of this, each page's name and its two scene labels are written on its `<main>` tag (`data-page`, `data-hud1`, `data-hud2`). A new page needs those three, plus the same header, menu and `<head>` block as the others, and an entry in `FILES` in `js/ui.js`.
- Fixed: the category buttons on the Work page showed nothing for categories with more than one word ("Fashion & lifestyle", "Real estate" and so on). A card's `data-tags` is now matched as a whole label; use `|` between labels to put a card in two categories.
- No flash when a page loads: a small script in each page's `<head>` keeps the content hidden until the scene has drawn its first frame. If you add a new page, copy that `<style>` and `<script>` block into its `<head>` too.
- A page opened from a link on the site always starts at its top.
- The next page is fetched while the pointer is still on its link, so it opens faster.
- Phones (screens up to 760px wide): Services and Our work on the home page are strips you swipe left and right, with the title above the strip. Each shows three cards and a "See more" card that opens the Services page or the Work page. Laptop and desktop are unchanged. The number of cards is the `n+4` in the version 11 block near the end of `css/style.css`; the card labels ("11 more services", "15 more brands") are in `index.html`.

## Versions 16 to 19 (summary)
- 17 brands. Each brand card on the home page and the Work page shows the brand's logo and opens that brand's own page, `work-<brand>.html`.
- Logos live in `assets/brands/` (small, for cards and the orbit) and `assets/brands/large/` (for the brand pages).
- A brand page fills itself from that brand's folder, `assets/work/<brand>/`. Whatever is missing is simply not shown.

## Version 20 changes
- Every brand now has its folder in `assets/work/<brand>/` filled with that brand's posts and films, so each brand page shows a "Posts" row and a "Films" row.
- What goes in a brand's folder:
  - `post-1.jpg`, `post-2.jpg`, `post-3.jpg`: pictures for the Posts row.
  - `film.mp4`: a wide video. `reel.mp4`, `reel-2.mp4`, `reel-3.mp4`, `reel-4.mp4`: upright videos (new: up to four).
  - `film.jpg`, `reel.jpg`, `reel-2.jpg` and so on: the still shown before a video plays (new).
  - `work.txt`: the "What we did" text. First lines can be `services: Social media, Films` and `website: https://...`, then the paragraphs. None of the brands has this file yet, so that block stays hidden until you add it.
  - `site.jpg`: a screenshot of the brand's website.
- Each video now takes the shape of its own footage (wide, square or upright), and starting one video pauses the others.
- Videos are cut at 60 seconds and compressed to keep the site light.
- `sw.js` is now `rps-v20`, and videos are not saved for offline use.

## Version 21 changes
- Brand pages: posts and films now line up. Every picture and video is a tile of the same size and shape (4:5), with the same corners and the same spacing.
- Laptop and desktop: posts and films sit side by side in one row, "Posts" above the pictures and "Films" above the videos. A wide film (`film.mp4`) is two tiles across and the same height as the rest.
- Phone and tablet (up to 900px wide): one wall with two tiles to a row under "Posts and films". The wide film, and any tile that would be left alone on its row, takes the full width.
- A picture or video that is not 4:5 is trimmed at the edges to fit its tile. A video shows in full when opened full screen; a picture shows in full when clicked.
- This replaces the version 20 behaviour where each video took the shape of its own footage.
- `sw.js` is now `rps-v21`.

## Version 22 changes
- Every brand page now has its "What we did" block: the service tags, two paragraphs on the work, a "Delivered" list and a link to the brand's website. The text for a brand is in `assets/work/<brand>/work.txt` and can be edited in any text editor.
- Format of `work.txt`: first line `services: A, B, C`, second line `website: https://...`, then paragraphs with an empty line between them, then the list with each line starting `- `.
- On wide screens the paragraphs sit on the left and the "Delivered" list on the right; on phones they stack.
- Brand cards on the home page and the Work page show the service done for that brand (the `wk-svc` label inside each card in `index.html` and `work.html`). If you change a brand's service, change it in both pages and in that brand's `work.txt`.
- `sw.js` is now `rps-v22`.

## Version 23 changes
- The link to each brand's own website is removed from the brand pages (the `website:` line is gone from every `work.txt`).
- Brand pages open faster:
  - Each brand page lists its own media on its `<section class="block case" ...>` tag, for example `data-media="post-1 post-2 reel reel-2"`. The page no longer searches the folder file by file, so nothing is requested that is not there. If you add or remove a picture or video in a brand's folder, change this list too. (A page without the list still searches the folder, as before.)
  - A video is fetched only when the visitor presses play. Until then only its still is loaded.
  - Each post has a small copy for its tile (`post-1-s.jpg`, 720px wide). Clicking the tile opens the full picture (`post-1.jpg`). When you add a post, add both files; without the small copy the full picture is used.
  - The large logos in `assets/brands/large/` are now 880px (they were 2400px), and the card logos in `assets/brands/` are 320px (they were 600px).
  - Pointing at a brand card fetches that brand's page and large logo in advance.
- Smoother scrolling on the home page and the Work page: brand cards no longer blur the moving scene behind them, and the scroll effect only redraws the elements that changed.
- `sw.js` is now `rps-v23`.

## Version 24 changes
- Every service has its own page, `service-<name>.html` (14 pages at the time; 11 from version 26). Each has a short paragraph, a "What you get" list, the six steps of the work and a 30-second film.
- On the Services page and the home page, each service card opens its page.
- The films are in `assets/services/`: `<name>.mp4` (1920x1080, 30 seconds, music only, no voice) and `<name>.jpg`, the still shown before the film plays. A film is fetched only when the visitor presses play.
- To change the text of a service, edit its `service-<name>.html` directly: the paragraph is `svc-para`, the list is `svc-get` and the steps are `svc-steps`.
- The studio address on every page is the one on the visiting card: No. 58/59, 1st Cross, B Cross, Bannerghatta Road, Doresanipalya, Bilekahalli, Bengaluru, Karnataka 560076. The map button on the About page points to it.
- `sw.js` is now `rps-v24`.

## Version 25 changes
- The brief form on the contact page can now send straight to a Google Sheet (see "Contact form" above). Until an address is pasted into `formEndpoint`, the form behaves as before.
- The form has a hidden field that only automated spam fills in; such entries are dropped.
- `sw.js` is now `rps-v25`.

## Version 26 changes
- Eleven services instead of fourteen. Brand audits and Digital marketing are removed. Video & ad shoots is folded into TV commercials, now "TV commercials & ad shoots".
- The Services page, the home page strip and the service pages are renumbered 01 to 11, and the three removed pages and their films are gone.
- All eleven films were made again, so their numbering ("Service 03 / 11") and their closing frame (eleven artifacts) match.
- `sw.js` is now `rps-v26`.

## Behaviour notes
- The home page plays the full intro once; inner pages fade in. "Replay intro" in the home footer plays it again.
- Links between pages swap the content without reloading: the old page slides and fades out, the new one rises in.
- "Start a project" goes straight to the contact page ("Start a mission") everywhere, including the home page. The in-between launch screen has been removed.
- Visitors with "reduce motion" turned on get a calm version with no warp, fly-by or transitions.
