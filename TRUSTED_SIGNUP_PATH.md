# Trusted Signup Path

## Goal

Move public signup writes out of direct browser-to-Firestore writes and behind a trusted backend
path so slot capacity is enforced server-side.

The target is:

- parent signup remains simple
- leaders keep the current Firebase admin flow
- capacity cannot be oversubscribed by concurrent clients
- the solution stays as close to free as possible

## Recommendation

Use **one HTTPS Cloud Function** as the only public signup write path.

The browser should no longer write directly to:

- `signups`
- `signupContacts`

Instead it should POST to one trusted endpoint, for example:

- `submitSignup`

That function becomes the single authority for:

- event existence
- slot existence
- slot capacity
- waitlist decision
- creating both Firestore documents atomically

## Why this is the smallest viable change

It changes only one critical path:

- public parent signup

It does **not** require rewriting:

- leader admin
- member management
- meeting management
- attendance tracking

It also lets Firestore stay the system of record while moving trust enforcement to a server-side
runtime.

## Cost impact

This is the smallest safe step, but it likely means moving to a **billing-enabled Firebase project**.

Reason:

- Firebase pricing shows Cloud Functions free quotas under the Blaze/pay-as-you-go side, not under
  the Spark-only side.
- In practice that means the project will usually need Blaze enabled even if actual monthly cost
  remains near zero at low usage.

Source:

- <https://firebase.google.com/pricing>

Important distinction:

- **Billing-enabled** is not the same as **expensive**
- For a small scout group, this can still remain effectively free or very close to free if usage is low

## Architecture

### Current

Browser:

1. reads `events`
2. reads `signups`
3. writes `signups`
4. writes `signupContacts`

Problem:

- any client with valid frontend code can attempt the write
- capacity is not fully authoritative

### Proposed

Browser:

1. reads `events`
2. reads `signups` for display only
3. POSTs signup payload to trusted backend

Trusted backend:

1. validates request payload
2. loads event
3. finds slot
4. calculates confirmed capacity
5. decides:
   - confirmed signup
   - waitlist signup
   - reject
6. writes `signups/{id}`
7. writes `signupContacts/{id}`
8. returns result payload

## Minimal Firebase services

### Required

- Firestore
- Firebase Hosting
- Firebase Authentication for leaders
- **Cloud Functions** for trusted signup writes

### Strongly recommended

- **App Check**

App Check does not replace the trusted backend, but it reduces abuse from non-genuine clients.

## Request contract

### Endpoint

`POST /submitSignup`

### Input

```json
{
  "eventId": "abc123",
  "slotId": "s1",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "adult": true,
  "groupSize": 1,
  "childMode": false
}
```

### Output

```json
{
  "status": "confirmed",
  "signupId": "xyz789",
  "waitlist": false,
  "slotLabel": "16:00 – 18:00"
}
```

Possible statuses:

- `confirmed`
- `waitlist`
- `full`
- `invalid`
- `not_found`

## Firestore write rules after cutover

### Public browser should no longer create these directly

- `signups`
- `signupContacts`

### New rules direction

Allow:

- public read of `events`
- public read of `signups` if you still want visible participant names
- leader read/write where appropriate

Deny:

- direct unauthenticated create to `signups`
- direct unauthenticated create to `signupContacts`

That ensures only the trusted function can create signups.

## Function behavior

### Validation

Reject if:

- event does not exist
- slot does not exist
- name missing
- email invalid when required
- `groupSize` outside allowed slot range

### Capacity logic

For the requested slot:

- count only non-waitlist signups
- sum `groupSize`
- compare against slot `capacity`

If enough room:

- create confirmed signup

If not enough room and waitlist is allowed by product policy:

- create waitlist signup

Else:

- return `full`

### Write strategy

Use one backend transaction or one backend-controlled logical unit so:

- the capacity check and both document writes are performed together

## Recommended implementation shape

### Function runtime

Node.js Cloud Function

### Function file shape

Suggested future structure:

```text
functions/
  package.json
  src/
    index.ts
    submitSignup.ts
    validateSignup.ts
    firestore.ts
```

Only one public function is required initially.

## Frontend changes needed

### `public/index.html`

Replace direct Firestore signup writes with:

- `fetch()` to the trusted endpoint

Keep:

- event reads
- signup reads for display
- modal and UI behavior

### `Code.gs`

No structural change required.

After the trusted function returns success, frontend can still trigger the existing Apps Script
notification flow, or the function can take over notification dispatch later.

Smallest change:

- keep notifications where they are for now

Safer long term:

- move notification trigger into the trusted function

## Recommended rollout order

1. Add function runtime
2. Implement `submitSignup`
3. Change frontend signup POST path
4. Verify confirmed/waitlist/full cases
5. Tighten Firestore rules to block direct public creates
6. Add App Check if desired

## Definition of done

This change is done when:

- parents can still sign up from the public page
- slot capacity is enforced by trusted backend logic
- direct public writes to `signups` are blocked
- leader flows still work
- waitlist still works
- email/contact data is still stored correctly

## What I would implement first

If you want the actual build next, the smallest real implementation step is:

1. scaffold `functions/`
2. add one `submitSignup` HTTPS function
3. switch `public/index.html` to call it
4. tighten Firestore rules

That is the minimum change set that materially upgrades trust.
