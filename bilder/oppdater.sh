#!/bin/bash
# Oppdaterer bildelistene på nettsiden.
#
#   bilder/web/header/   → bildene i slideshowet øverst (sortert etter filnavn,
#                          sett gjerne 1, 2, 3 … foran navnet for å styre rekkefølgen)
#   bilder/web/          → bildene på galleri-siden (sortert etter filnavn)
#
# Kjør fra Terminal etter at du har lagt til eller fjernet bilder:
#   bash bilder/oppdater.sh
#
# Skriptet lager også små forhåndsvisninger i bilder/web/liten/ (krever macOS).

cd "$(dirname "$0")" || exit 1
mkdir -p web/liten

er_bilde() { case "$(echo "$1" | tr '[:upper:]' '[:lower:]')" in *.jpg|*.jpeg|*.png|*.webp) return 0 ;; esac; return 1; }

liste() {
  local mappe="$1" forste=1
  for f in "$mappe"/*; do
    [ -f "$f" ] && er_bilde "$f" || continue
    [ $forste -eq 1 ] && forste=0 || printf ',\n'
    printf '  "%s"' "$(basename "$f")"
  done
  printf '\n'
}

# Små forhåndsvisninger til galleriet
nye=0
for f in web/*; do
  [ -f "$f" ] && er_bilde "$f" || continue
  navn="$(basename "$f")"
  if [ ! -f "web/liten/$navn" ] || [ "$f" -nt "web/liten/$navn" ]; then
    sips -Z 900 -s formatOptions 70 "$f" --out "web/liten/$navn" >/dev/null 2>&1 && nye=$((nye + 1))
  fi
done

# Fjern forhåndsvisninger for bilder som er slettet
for t in web/liten/*; do
  [ -f "$t" ] || continue
  [ -f "web/$(basename "$t")" ] || rm "$t"
done

{
  echo "/* LAGES AUTOMATISK av bilder/oppdater.sh – ikke rediger for hånd. */"
  echo
  echo "window.HEADER_BILDER = ["
  liste web/header
  echo "];"
  echo
  echo "window.GALLERI_BILDER = ["
  liste web
  echo "];"
} > bilder.js

echo "Header:  $(ls web/header | grep -ciE '\.(jpe?g|png|webp)$') bilder"
echo "Galleri: $(ls web | grep -ciE '\.(jpe?g|png|webp)$') bilder"
echo "Nye forhåndsvisninger: $nye"
echo "Ferdig – bilder/bilder.js er oppdatert."
