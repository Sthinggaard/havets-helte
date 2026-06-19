# Forældrehelte — Projektoverlevering

Platform for Havets Helte (søspejderforening, DDS-tilknyttet) hvor forældre melder sig
som frivillige til opgaver og vagter. Bygget som statisk web-app på Firebase Hosting +
Firestore, med gratis mail-notifikationer via Google Apps Script.

Sproget i UI og kode-kommentarer er dansk. Brugeren (Søren) er teknisk (cand.scient.),
foretrækker direkte, høj-signal feedback uden hedging.

---

## Stack

- **Hosting:** Firebase Hosting (statiske filer, single-page: No)
- **Database:** Cloud Firestore (Standard edition, lokation eur3/europe-west, Spark/gratis)
- **Auth:** Firebase Auth (Email/Password) — kun for ledere
- **Mail:** Google Apps Script web-app (gratis, sender via Workspace-Gmail)
- **Frontend:** Vanilla HTML/CSS/JS, ingen build-step. Firebase modular SDK v10.12.2 via CDN ESM.
- **Fonts/ikoner:** Inter (Google Fonts), Tabler Icons webfont via jsdelivr CDN
- **Analytics:** GA4 (valgfri, gtag)

Bevidst valg: ingen framework, ingen bundler. Filerne åbnes direkte og deployes som de er.
Begrundelse: minimal vedligehold for en frivillig forening, ingen CI-afhængighed.

---

## Filer

| Fil | Rolle |
|-----|-------|
| `public/index.html` | Offentlig side. Uden query-param: hub der lister aktive opgaver. Med `?event={id}`: tilmeldingsside for én opgave. Intet login for forældre. |
| `public/admin.html` | Lederside. Firebase Auth login → dashboard til at oprette opgaver (vagter + enkeltopgaver), se tilmeldinger med kontaktinfo, fremmøde (medlemmer + møder). |
| `public/attendance.html` | Leder-fremmøde-tracker. Vælg møde → marker tilstedeværelse per medlem. Kræver Auth-login. |
| `public/seed.html` | Seed- og rydside til lokal emulator-session. Opretter testdata: events, signups, medlemmer, møder, leder-konto. |
| `public/backfill-groups.html` | Auth-beskyttet hjælpeværktøj til at backfille legacy `gren`-data til `groupId`/`groupName` på members og meetings. |
| `functions/index.js` | Trusted backend path for public signup writes. Validerer input, håndhæver slot-kapacitet og opretter `signups` + `signupContacts` server-side. |
| `Code.gs` | Google Apps Script (projektrod). POST: mailer leder + sender forælder bekræftelse med afmeldingslink. GET: selvbetjent afmelding via `?cancel=<token>`. Logger valgfrit til Google Sheet. |
| `firestore.rules` | Firestore sikkerhedsregler. |
| `firebase.json` | Firebase Hosting + Emulator-konfiguration (Firestore :8081, Hosting :5003, Auth :9097, Functions :5004, UI :4000). |
| `public/og-sankthans.png` | Open Graph-billede til Facebook-deling (1200x630). |

---

## Datamodel (Firestore)

### `events/{eventId}` — offentlig læsning, kun ledere skriver
```
title: string
description: string
dateText: string          // fri tekst, fx "Tirsdag 23. juni" eller "Løbende"
location: string
type: 'timed' | 'task' | 'event'  // vagter med tider / enkeltopgaver / arrangement (fx Nathejk)
cancelDeadlineDays: number
paymentUrl: string         // MobilePay MyShop/Box-link, valgfri — bruges af 'paid'-slots
slots: [                   // array, ikke subcollection
  {
    id: string             // genereret 's'+Date.now()+i
    label: string          // tidsrum ("16:00 – 18:00") eller navn ("Kørsel", "Søndagshygge")
    sublabel: string       // rolle/detalje, valgfri
    capacity: number
    requiresAdult: bool     // kun relevant for kind='volunteer' på timed events
    kind: 'volunteer' | 'attend' | 'paid'   // deltagelsesform, se nedenfor
    price: number          // kr, kun for kind='paid' (ellers 0)
    groupMin: number       // min. deltagere pr. tilmelding (default 1)
    groupMax: number       // maks. deltagere pr. tilmelding (default 1 = individuel)
  }
]
active: bool
createdBy: string          // auth uid
created: timestamp         // serverTimestamp
```

### `signups/{signupId}` — OFFENTLIG læsning (viser hvem der er tilmeldt)
```
eventId: string
slotId: string
name: string               // vises offentligt på listen
adult: bool
paid: bool                 // valgfri, kun for paid-slots. Leder toggler i admin. Default false.
waitlist: bool             // valgfri. true = står på venteliste og tæller ikke mod kapacitet
uid: string                // valgfri, sat hvis forælder var Google-logget ind (matcher "mine vagter")
groupSize: number          // valgfri, default 1. Antal personer DENNE tilmelding dækker
                            // (fx en patrulje på 5). Kapacitet = SUM af groupSize, ikke antal docs.
created: timestamp
```
Oprettes nu via trusted backend path (`/api/submitSignup`), ikke direkte fra browseren.

### `signupContacts/{signupId}` — KUN ledere kan læse (GDPR)
```
eventId: string
name: string
email: string              // holdt ude af offentlig signups-collection
uid: string                // valgfri, hvis Google-logget ind
cancelToken: string        // valgfri, crypto.randomUUID — sendes i bekræftelsesmail som afmeldingslink
eventTitle: string         // kopi til brug ved afmelding uden ekstra Firestore-opslag
created: timestamp
```
Samme doc-id som det tilhørende signup (setDoc med ref.id fra addDoc på signups).
Oprettes nu via trusted backend path sammen med signup-dokumentet.

### `members/{memberId}` — kun ledere (auth)
```
name: string
groupId: string            // stabil nøgle, fx 'soespejder', 'junior', 'trop'
groupName: string          // visningsnavn, fx 'Søspejder'
gren: string               // legacy/backward-compat visningsfelt; skriv samme værdi som groupName
fødselsdato: string        // ISO-dato, fx '2013-03-12', valgfri
startdato: string          // ISO-dato, hvornår de startede i gruppen, valgfri
foto: bool                 // om foto er modtaget, default false
active: bool
created: timestamp
```
`active=false` betyder at medlemmet bevares i historik og admin, men ikke vises i fremmøde-checkin.

### `meetings/{meetingId}` — kun ledere (auth)
```
date: string               // ISO-dato, fx '2026-06-16'
groupId: string            // stabil nøgle der matcher members.groupId
groupName: string          // visningsnavn for grenen
gren: string               // legacy/backward-compat visningsfelt; skriv samme værdi som groupName
title: string              // valgfri overskrift, fx 'Sommermøde'
createdBy: string
created: timestamp
```

### `attendance/{attendanceId}` — kun ledere (auth)
```
meetingId: string
memberId: string
arrived: bool              // true = ankommet; doc eksisterer kun når arrived=true
markedAt: timestamp
markedBy: string           // auth uid
```
Doc-id er deterministisk `{meetingId}_{memberId}` — ingen query nødvendig for at toggle.
Ankommet: `setDoc({ arrived: true })`; Afventer/ikke ankommet: `deleteDoc`.
Default-tilstand er "Afventer" — click-to-check-in flow.

**Migrering af gren-data:** Nye members/meetings skal skrive `groupId` + `groupName`.
`gren` beholdes midlertidigt som legacy felt, så eksisterende data og views ikke knækker under
overgangen. Join mellem møder og medlemmer skal fremover ske på `groupId`, ikke fri tekst.
Eksisterende data kan backfilles via `public/backfill-groups.html`.

**GDPR-princip:** navne er offentlige (nødvendigt for "hvem er tilmeldt"-listen),
men mailadresser ligger separat og kan kun læses af autentificerede ledere.
Kapacitet håndhæves nu server-side via `functions/index.js` (`submitSignup`) med
Firestore-transaction, så samtidige tilmeldinger ikke kan overskrive slot-kapacitet.

---

## Deltagelsesformer (slot.kind)

Hver plads (slot) har en `kind` der styrer UI og flow. En event kan blande alle tre.

| kind | Betydning | Forside-sektion | Knaptekst | Betaling |
|------|-----------|-----------------|-----------|----------|
| `volunteer` | Forælder hjælper (vagt/opgave) | "Hjælp til" | "+ Meld dig på" | nej |
| `attend` | Gratis tilmelding/RSVP (fx søndagshygge, fællesspisning) | "Deltag" | "+ Tilmeld dig" | nej |
| `paid` | Deltagelse mod gebyr (fx lejr) | "Deltag" | "Tilmeld og betal X kr" | ja, via MobilePay |

`requiresAdult` (mindst én voksen >18) gælder kun `volunteer` på timed events.
Bagudkompatibilitet: slots uden `kind` behandles som `volunteer`.

## Gruppetilmelding (slot.groupMin / slot.groupMax)

Generel, valgfri egenskab på ENHVER plads — ikke bundet til en bestemt event-type
eller `kind`. Bevidst designet sådan efter eksplicit ønske om en generisk primitiv
i stedet for noget hardcodet til ét anvendelsestilfælde (se Nathejk-eksemplet nedenfor).

Når `groupMax > 1` tillader pladsen at én tilmelding dækker flere personer:
- Admin viser et "Tilmelding sker i grupper"-toggle pr. plads, med min/max-felter.
- Forsiden viser et "Antal deltagere"-felt i tilmeldingsmodalen (clampet til min/max
  og til hvad der reelt er tilbage af kapacitet).
- Visning af pladsen skifter fra faste tomme/fyldte rækker (1 pr. kapacitetsenhed) til
  en liste af faktiske tilmeldinger (med "× N deltagere"-badge) + en tekstlinje
  "X af Y pladser tilbage". Nødvendigt fordi antal tilmeldinger ikke er kendt på forhånd
  når gruppestørrelse varierer.
- Kapacitet beregnes overalt (forside, admin, event-kort) som SUM af `groupSize`
  across signups for den slot — ikke `signups.length` eller `snapshot.size`.

**Eksempel — Nathejk:** Det Danske Spejderkorps' landsdækkende adventurespejderløb
(natløb/hejk for tropsspejdere 12-16 år, ca. 200 kr/spejder, tilmelding sker patruljevis
via tilmelding.nathejk.dk). Havets Helte samler penge ind lokalt og tilmelder patruljer
samlet hos arrangøren. I appen: opret en `paid`-plads med groupMin=groupMax=5 (patruljestørrelse),
price=200, og foreningens MobilePay-link. Patruljen tilmelder sig som ÉN gruppe og betaler
den samlede pris. Den faktiske patruljetilmelding på tilmelding.nathejk.dk forbliver et
manuelt, eksternt skridt for lederne — se "Hvad appen bevidst ikke gør" nedenfor.

## Betalingsflow (MobilePay — "niveau 1", link-ud)

Bevidst valg: INGEN dyb PSP/webhook-integration. Begrundelse: gratis/næsten-gratis,
ingen Blaze-plan, ingen server, regnskabet bliver i MobilePays eget system.

Flow ved en `paid`-plads:
1. Forælder udfylder navn+mail → `signups`-doc oprettes med `paid: false`.
2. Kontakt gemmes i `signupContacts`.
3. Apps Script-notifikation sendes (leder + bekræftelse).
4. Browseren åbner `event.paymentUrl` (MobilePay MyShop/Box-link) i ny fane.
5. Leder afstemmer MANUELT: sammenholder MyShop-dashboard med navne i admin og
   klikker "Betalt ✓" (toggler `signups/{id}.paid` via updateDoc, kræver auth).

MobilePay-pris (pr. 2024/2026): ca. 0,99% pr. transaktion via MyShop
(integrerede betalinger 0,99% + 1 kr). Kræver erhvervs/forenings-aftale på
foreningens CVR — bestyrelsesopgave, ikke en udvikleropgave.

Mulig "niveau 2"-opgradering (ikke bygget): rigtig MobilePay Online/Checkout via PSP
+ webhook → Apps Script (eller Cloud Function på Blaze) → sæt `paid: true` automatisk.

Forenklinger i nuværende version: én pris per plads (ingen voksen/barn-billettyper),
ingen tilbagebetaling ved afmelding.

---

## Konfiguration der skal udfyldes

Begge HTML-filer har øverst i `<script type="module">`:
```js
const firebaseConfig = { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId };
```
SAMME config i begge filer. Hentes i Firebase Console → Project settings → Your apps → web-app.
API-nøglen er IKKE hemmelig (normalt for Firebase web); sikkerhed ligger i Firestore-reglerne.

`index.html` har desuden:
```js
const APPS_SCRIPT_URL = '...';   // web-app URL fra Apps Script deployment
const SHARED_SECRET   = '...';   // skal matche SHARED_SECRET i Code.gs
```
Og valgfri GA4: erstat `G-XXXXXXXXXX` (2 steder).

`Code.gs` har:
```js
const NOTIFY_EMAIL  = '...';     // leder der får besked
const SHARED_SECRET = '...';     // matcher index.html
const PROJECT_ID    = '...';     // Firebase-projekt-id, fx 'havets-helte-abc12' — kræves for afmelding via doGet
const SHEET_ID      = '';        // valgfri Google Sheet-log, tom = spring over
```
`PROJECT_ID` bruges i `doGet` til at kalde Firestore REST API med `ScriptApp.getOAuthToken()`.
Scripts OAuth-token kræver disse scopes i `appsscript.json`:
```json
"oauthScopes": [
  "https://www.googleapis.com/auth/datastore",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/script.external_request",
  "https://www.googleapis.com/auth/gmail.send"
]
```

OG-tags i index.html: erstat placeholder-URL med rigtig hosting-URL (Facebook-preview).

---

## Deploy

```bash
firebase deploy            # fra mappen med firebase.json + filerne
```
VIGTIGT: firebase init lægger en placeholder index.html i public-mappen. Læg de rigtige
filer i public-mappen EFTER init, og svar aldrig "yes" til at overskrive index.html.

Auth-opsætning: Console → Authentication → Email/Password → Add user (ledere oprettes manuelt).
Det er adgangsstyringen: kun folk med en konto kan oprette opgaver. Ingen selvbetjent signup for ledere.

---

## Hvad appen bevidst IKKE gør (vigtigt arkitekturprincip)

Foreningen er allerede tilknyttet DDS og bruger Medlemsservice (medlem.dds.dk) til
kontingent og medlemsdata. Princippet for denne app: **eje det DDS ikke kan, link til
det DDS allerede gør godt.** Hver gang appen overlapper DDS, flytter ansvar (juridisk,
GDPR, vedligehold) over på en frivilligt drevet kodebase — det er en reel risiko, ikke
kun smag. Konkret betyder det:

- **Ingen kontingent eller medlemsdata.** Det er DDS's kerne. Røres ikke.
- **Ingen følsomme persondata om børn** (allergier, helbred, CPR, adresser). DDS's egen
  dokumentation flagger selv den slags som følsomme persondata med krav om proportional
  opbevaring. Arrangementer der kræver den slags (lejre, overnatninger) skal bruge
  Medlemsservices arrangementsmodul, IKKE denne app — heller ikke som et "description"-felt.
- **Ingen dyb betalingsintegration ("niveau 2").** Se betalingsflow ovenfor — appen linker
  til MobilePay/Medlemsservice, registrerer ikke selv kort/transaktion, og "betalt" sættes
  manuelt af en leder.
- **Ingen ekstern eventregistrering** (fx Nathejks tilmelding.nathejk.dk, eller
  Medlemsservices eget arrangementsmodul). Appen samler interesse + lokal betaling;
  den faktiske tilmelding hos en ekstern arrangør forbliver et manuelt skridt for ledere.
  Bygges det ind i appen, ender man med at duplikere et system der allerede virker.
- **Ingen patruljedannelse eller anden ekstern logistik.** Gruppetilmelding (se ovenfor)
  løser "betal og meld interesse som gruppe" — ikke selve organiseringen af hvem der er
  i hvilken patrulje. Det forbliver en lederopgave uden for appen.

Det appen SKAL eje fuldt ud: frivillig-koordinering (vagter, hjælp-til-opgaver),
gratis tilmelding/RSVP, og — efter eksplicit ønske — en generisk, konfigurerbar
tilmeldingsprimitiv (deltagelsesform + evt. gruppe + evt. betalingslink) som ledere selv
sætter op uden kodeændringer. IKKE feature-specifikke hacks for enkelte arrangementer.

---

## Kendte begrænsninger / bevidste fravalg

1. **Trusted signup path kræver Firebase Functions i drift.** Lokalt og i produktion skal
   `functions/` dependencies installeres og funktionen deployes, ellers virker
   `/api/submitSignup` ikke. Det er nu den eneste gyldige oprettelsesvej for `signups`
   og `signupContacts`.
2. **Ingen .ics kalenderinvitation** i nuværende version. Datoer er fri tekst, ikke
   maskinlæsbare start/slut-tidspunkter, så .ics kan ikke genereres pålideligt.
   Kræver strukturerede datetime-felter på slots hvis ønsket.
3. **Selvbetjent afmelding afhænger af Apps Script-konfiguration.** Flowet er bygget:
   `Code.gs` sender cancel-link i mail og sletter `signupContacts` + `signups` via
   Firestore REST, men virker kun når `PROJECT_ID`, deployment-URL og scopes er sat korrekt.
4. **SHARED_SECRET er synlig i klient-kildekode.** Stopper tilfældig misbrug, ikke en
   målrettet angriber. Acceptabelt for en spejderforening.
5b. **Firestore-regler** blokerer nu direkte client-create på både `signups` og
   `signupContacts`. Ledere (auth) kan stadig læse `signupContacts`, toggle `paid` /
   `waitlist` på `signups` og slette records ved behov.
5. **Apps Script POST bruger no-cors.** Kan ikke læse svaret; beskeden når frem alligevel
   (samme mønster som det tidligere Google Forms-trick). e.postData.contents JSON-parses
   i doPost selvom content-type bliver text/plain.
6. **Ledernotifikation går til én hardcodet NOTIFY_EMAIL.** Per-opgave routing til
   opgavens egen leder er en mulig udvidelse (gem leder-mail på event, send med i payload).

## GitHub Deploy Gate

- `Deploy` workflow kører kun manuelt via `workflow_dispatch`.
- Jobbet er bundet til GitHub environment `production`.
- Sæt required reviewers på `production` environment i GitHub repo settings, hvis deploy skal kræve menneskelig godkendelse før release.

---

## Roadmap / mulige næste skridt

- **Google-login for forældre** — ALLEREDE WIRET IND i index.html (currentUser, doGoogleLogout,
  loadMine, 'mine vagter' via signups.uid). Kræver at Google som sign-in provider er slået
  til i Firebase Auth. Gratis på Spark. Forudfylder navn/mail i tilmeldingsmodal.
- **DDS "Blåt Login" SSO** — undersøges via bestyrelsen/DDS-kontakt. Blåt Login er DDS's
  interne SSO (medlemsnummer + Blåt Medlem-kode). Ingen offentlig tredjeparts-OIDC fundet;
  kræver sandsynligvis partnerskab med DDS + Firebase Identity Platform-tier (ikke ren gratis).
  Skal IKKE blokere MVP — skift identitetslag senere, datamodel er uændret.
- **Selvbetjent afmelding** via Apps Script + Firestore REST (se begrænsning 3).
- **"To arrangementer om året"-tracking** per forælder — kræver stabil identitet
  (mail-matching eller login).
- **Transaktionssikker kapacitet** hvis dobbeltbooking bliver et reelt problem.

---

## Designsystem (for konsistens ved nye sider)

```
--navy:#0b1f3a  --navy-mid:#152d50  --navy-light:#1e3d6e  --gold:#e8a020
--white:#f8f9fb --text:#1a2535 --muted:#6b7a8d --border:#d6dce6
--success:#1a7a4a --success-bg:#eaf5ee --success-border:#9fd4b4
--warn-bg:#fff8ec --warn-border:#f5d080  --danger:#c0392b
```
Font: Inter (400/500/600). Ikoner: Tabler webfont `ti ti-*`.
Navy hero-bånd øverst, gold accent, hvidt content-kort med afrundede hjørner.
Mobile-first (de fleste forældre åbner via Facebook-link på telefon).

UX-princip brugeren holder af: design skal være selvforklarende. Ingen tooltips eller
forklarende tekst der kompenserer for uklart design.
