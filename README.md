# AutoCruise – www.autocruise.no

Statisk nettside (HTML/CSS/JS), klar for GitHub Pages. Ingen byggesteg.

## Struktur

```
index.html            Forsiden
biler.html            Våre biler (FINN-listen)
galleri.html          Galleri (mosaikk + storbilde)
css/style.css         Design
js/main.js            Slideshow, scrolleffekter, galleri, meny, skjema
img/                  Logo og partnerlogoer
bilder/web/header/    Bilder til slideshowet (rekkefølge etter filnavn)
bilder/web/           Bilder til galleriet
bilder/web/liten/     Små forhåndsvisninger (lages automatisk)
bilder/bilder.js      Bildelister (lages automatisk)
bilder/oppdater.sh    Oppdaterer listene og forhåndsvisningene
bilder/bildetekster.js  Beskrivelse (alt-tekst) for hvert bilde – rediger for hånd
html/                 Videresending fra gamle adresser (/html/biler.html, /html/kontakt.html)
sitemap.xml, robots.txt, 404.html   SEO og feilside
```

## Legge til bilder

1. Legg bildet i `bilder/web/header/` (slideshow) eller `bilder/web/` (galleri).
2. Kjør `bash bilder/oppdater.sh`.
   Legg gjerne til en kort beskrivelse av bildet i `bilder/bildetekster.js` (bra for Google).
3. Commit og push – siden oppdateres automatisk.

Etter endringer i CSS/JS: øk `?v=`-tallet i `index.html`, `biler.html` og `galleri.html` så besøkende får ny versjon.

GitHub skiller mellom store og små bokstaver: `Bil.JPG` og `bil.jpg` er ikke samme fil.

## Publisere på GitHub Pages

1. Opprett et repo på GitHub og push innholdet i denne mappen.
2. Repo → **Settings → Pages** → Source: *Deploy from a branch* → `main` / `/ (root)`.
3. Egendefinert domene: skriv `www.autocruise.no` under *Custom domain* og slå på *Enforce HTTPS*.
   Hos domeneleverandøren: CNAME-post for `www` → `<brukernavn>.github.io`, og A-poster for `autocruise.no` til
   185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153.

## Lokal forhåndsvisning

```bash
python3 -m http.server 8080
```
