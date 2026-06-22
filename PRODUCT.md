# Product

## Register

product

## Users

Primær bruger er frivillige, ulønnede ledere i en søspejderforening (Havets Helte, DDS-tilknyttet).
De skal kunne oprette arrangementer, opgaver og vagtplaner, se forældretilmeldinger, vedligeholde
medlemslisten og registrere fremmøde ved møder og aktivitetsdage. Appen bruges ofte fra telefonen,
i farten og under tidspres, ikke fra et skrivebord med god tid. Brugerne er ikke nødvendigvis
tech-stærke; nogle ledere er ældre.

Sekundær bruger er forældre, som fra den offentlige side skal kunne se relevante arrangementer og
melde sig på opgaver, vagter eller deltagelse med så lidt friktion som muligt, helst uden login.

## Product Purpose

Et gratis driftsværktøj for spejderledere med to kerneopgaver:

1. Forældrekoordinering
- Opret arrangementer med tilmeldingspladser
- Opret opgavelister som forældre kan melde sig på
- Opret vagtplaner som forældre kan dække
- Se hvem der har meldt sig på hvad

2. Spejderdeltagelse og fremmøde
- Vedligehold en medlemsliste over spejdere
- Opret møder og aktivitetsdage
- Tjek spejdere ind ved ankomst
- Bevar overblik over hvem der faktisk deltog

Appen skal reducere administrativ friktion for ledere, ikke skabe mere af den. Den skal være så
enkel, tydelig og billig i drift, at en lille frivillig forening realistisk kan bruge og vedligeholde
den uden løbende udviklerafhængighed.

Kerneprimitiverne i produktet er:
- Arrangementer
- Pladser (opgaver, vagter, deltagelse)
- Forældretilmeldinger
- Medlemmer
- Møder og aktivitetsdage
- Fremmøderegistreringer

Success betyder:
- En leder kan oprette et nyt arrangement eller en ny vagt fra telefonen hurtigt og uden tvivl
- En forælder kan melde sig på uden at skulle lære systemet først
- En leder kan på dagen se både hvem der hjælper, og hvilke spejdere der er mødt op
- Løsningen forbliver gratis i drift

## Brand Personality

Ligetil og tillidsvækkende, effektivt og hurtigt. Ingen overraskelser — det skal altid være
soleklart hvad der sker når man klikker noget. Varmt nok til at det ikke føles som et koldt
virksomheds-system (det er en spejderforening, ikke en SaaS-startup), men personlighed kommer
fra klarhed og omtanke i detaljen, ikke fra dekoration.

## Anti-references

Det generiske "AI byggede dette"-SaaS-dashboard-look: ensartede kort med ikon+heading+tekst,
gradient-hero-tal, overdreven skygge/glassmorphism, side-stripe-borders som dekorativ accent.
Også undgå det kolde enterprise-værktøjs-look (Jira/SAP-agtig tæthed og distance).

## Design Principles

- Selvforklarende frem for forklarende — ingen tooltips eller hjælpetekst der kompenserer for
  uklart design. Hvis et felt kræver en forklaring, er feltet forkert designet.
- Mobile-first i praksis, ikke kun i teorien — den primære bruger holder telefonen i én hånd.
- Tydelige labels og direkte feedback frem for clever/kompakt UI — en ulønnet leder skal aldrig
  gætte hvad et felt betyder.
- Parent signup skal være lavfriktion som standard — kun bed om det der er nødvendigt for at
  kunne koordinere hjælpen.
- Fremmøde-flowet skal være hurtigt nok til brug ved reel ankomst på en aktivitetsdag, ikke kun
  i en rolig admin-situation.
- Ekstra omtanke om kontrast, label-størrelse og fejltilstande, da brugergruppen spænder bredt
  i tech-erfaring og alder.
- Genbrug det eksisterende navy/gold-designsystem frem for at opfinde nyt — konsistens over tid
  betyder mere end nyhedsværdi i et lille, frivilligt drevet værktøj.

## Budget Constraint

Dette produkt må ikke afhænge af betalte tiers, billing-enabled services eller infrastruktur,
der kræver løbende driftsudgift for at fungere som tænkt. Hvis en løsning kræver betaling for at
opretholde kernefunktionalitet, er den ikke i scope for denne version.

## Accessibility & Inclusion

Ekstra vigtigt: nogle ledere er ældre eller mindre tech-stærke. Prioriter høj kontrast, tydelig
label-tekst (ikke kun placeholder), generøse touch-targets (44px+), synlige fokus-states, og
fejlbeskeder der siger præcis hvad der skal rettes — ikke kun at noget er forkert.
