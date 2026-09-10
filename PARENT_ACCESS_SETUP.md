# Passwordless forældre-adgang

Forældre bruger Firebase Email Link til at få en kortlivet engangsadgang. Firebase opretter ikke et
password-flow, og Functions viser aldrig om en mail allerede findes.

## Før første deploy

1. Aktivér **Email/Password** og **Email link (passwordless sign-in)** i Firebase Authentication.
2. Sørg for at `PARENT_ACCESS_SITE_URL` er et autoriseret Firebase Auth-domæne.
3. Sæt Apps Script-hemmeligheden i Cloud Secret Manager:

   ```bash
   firebase functions:secrets:set PARENT_ACCESS_APPS_SCRIPT_SECRET
   ```

4. Ved Functions-deploy sættes `PARENT_ACCESS_APPS_SCRIPT_URL` til den eksisterende Apps Script
   Web App-URL. `PARENT_ACCESS_SITE_URL` har som standard `https://havets-helte.web.app`, men kan
   sættes til den faktiske Hosting/custom-domain URL.
5. Indsæt den opdaterede `Code.gs` i Apps Script. Åbn **Project Settings** →
   **Script properties** og opret `PARENT_ACCESS_APPS_SCRIPT_SECRET` med samme
   værdi som Firebase-hemmeligheden. Hemmeligheden må ikke stå i `Code.gs`.

Deploy derefter Functions og Firestore-regler sammen. Der sendes ikke en mail direkte fra Firebase;
Functions sender den genererede Firebase-link videre til Apps Script, som fortsat bruger den
eksisterende gratis maillevering.

## Admin-domæne

Den eksisterende kodebase bruger `@havetshelte.dk` som lederdomæne i både klient og Firestore-regler.
Det domæne får ikke et forældrelink og sendes til den eksisterende `/admin`-login. Hvis det i stedet
skal være `@havetshelte.com`, skal adminpolitikken ændres samlet i `useAdminAuth.ts` og reglerne —
det er ikke gjort implicit her.

## Bevidst efterladt til senere

- Historiske `signupContacts` uden `emailNormalized` kan kun findes, hvis deres gemte mail allerede
  er lower-case; en separat, kontrolleret backfill bør køres før en fuld historisk migrering.
- iCal og selvbetjent GDPR-eksport/sletning har ingen eksisterende implementation og er ikke udvidet
  som en del af adgangsflowet.
