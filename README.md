# Erdetek Website

Open-source static website for ERDETEK SP. Z O.O.

## Languages

The public site ships with seven language packs:

- Polish (`pl`)
- Ukrainian (`uk`)
- Russian (`ru`)
- English (`en`)
- German (`de`)
- French (`fr`)
- Spanish (`es`)

## Structure

- `index.html` - browser entrypoint.
- `src/app.js` - renderer and language routing.
- `content/site.json` - source-of-truth content edited by CMS.
- `src/open.css` - small additions for language controls and source badges.
- `admin/` - Decap CMS GUI.
- `LICENSE` - MIT license.

No build step is required. The site can be served by any static web server.

## Editing Content

Business copy is kept in `content/site.json`. Edit it through `/admin/` or
directly in Git. Update one language object and mirror the same meaning across
the other languages. Company requisites should remain:

- ERDETEK SP. Z O.O.
- ul. Reymonta 19/7, 45-065 Opole, Poland
- EU VAT: PL7543075388
- KRS: 0000475884
- REGON: 161551933
- EORI: PL754307538800000

Bank account details are intentionally not published on the public website.

## CMS

The site includes Decap CMS in `admin/`.

For local editing:

```sh
npx decap-server
python3 -m http.server 8080
```

Then open `http://localhost:8080/admin/`.

For production editing, set the real GitHub repository in `admin/config.yml`:

```yaml
backend:
  name: github
  repo: OWNER/REPOSITORY
  branch: main
```

GitHub-backed Decap CMS also needs an OAuth backend for login. Until that is
configured, `/admin/` is present but cannot commit production changes.

## Deployment

Copy the files to the web root while keeping the existing `assets/` directory:

```sh
rsync -av index.html src content admin README.md LICENSE package.json /var/www/erdetek/
```
