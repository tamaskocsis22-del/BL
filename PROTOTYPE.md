# BL Driver Journal – áttekinthető tervezet

## Kipróbálás
Az index.html önálló, külső függőség nélkül megnyitható böngészőben. GitHubon a fájl Download raw file gombjával tölthető le. A közvetlen mobil fájlmegosztáshoz HTTPS és Web Share Files támogatás szükséges; helyi fájlból a PDF letöltése használható. Ez a változat nincs élesítve.

## Elkészült
- Mobilhoz igazodó fekete/arany munkanapló.
- Sofőrnév, munka neve, címek, megjegyzés, helyi képmellékletek.
- Indítás/leállítás, újranyitás után folytatódó időmérés.
- 3000 Ft/óra, időarányosan, transzferenként egész forintra kerekítve.
- Tételes egyéb költségek, munkadíj és teljes összeg külön.
- Induló/záró kilométeróra alapján tényleges km.
- Google Maps útvonal megnyitása, számított km és menetidő beolvasása nélkül.
- Nap/hét/hónap/összes és sofőr szerinti szűrés; a munka indulása dönti el az időszakot.
- Transzferenkénti és időszakos valódi PDF-fájl, magyar ékezetekkel. Kép alapú PDF, szövege nem kereshető. Mellékelt fotók nem szerepelnek a PDF-ben.
- PDF átadása az operációs rendszer megosztásának (WhatsApp/e-mail, ha elérhető); egyébként letöltés és kézi csatolás. Az app nem küld üzenetet automatikusan.
- JSON biztonsági export; visszaimportálás még nincs.

## Még szükséges a teljes verzióhoz
1. Központi adatbázis, valódi sofőrfiókok, admin jogosultságok és módosítási napló.
2. Passkey/WebAuthn regisztráció és hitelesítés szerverrel. Ujjlenyomat csak azt támogató készüléken; a készülék arcfelismerést vagy PIN-t is használhat.
3. Google Routes integráció szerveroldali kulccsal és kvótával; tervezett és tényleges km elkülönítése.
4. Google Drive OAuth, BL mappa létrehozása és képfeltöltés. A mappa jelenleg nincs létrehozva.
5. Előre tervezett transzferek, idősávok módosítása és megosztása.
6. Biztonságos többeszközös szinkronizálás. A prototípus egy böngészőben, egy aktív lapon használható. A névmező nem bejelentkezés.
7. Eszközös QA: Android/iPhone fájlmegosztás WhatsAppra és e-mailbe, PDF tördelés és mobil nézet vizuális ellenőrzése.

## Ellenőrzés
JavaScript szintaxis rendben. Automatikus ellenőrzések: 90 perc = 4500 Ft, költségösszesítés, negatív idő kezelése, HTML escape, hétfővel kezdődő heti szűrés. A PDF író kétoldalas A4 kimenetét pdfinfo sikeresen olvasta. A tényleges böngészős rajzolás és telefonos megosztás nincs még eszközön ellenőrizve.

A helyi tárolás törölhető a böngésző által; ezt a verziót ne tekintsétek hiteles bér- vagy munkaidő-nyilvántartásnak. A teljes rendszer indítása előtt felhasználói áttekintés szükséges.
