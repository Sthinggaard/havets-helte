# Event Admin Boundary

This folder owns the editable backend version of all three event types:

- `vagter` (`timed`)
- `opgaver` (`task`)
- `arrangementer` (`event`)

The admin surface is the source of truth for creating, editing, and deleting events. Public landing pages only read from the same `events` collection and render signup views.

The home feed groups active `task` and `timed` records under **Forældrehelte-opgaver**;
`event` records appear under **Spejdertilmeldinger**. Each card carries a matching
category badge. The tabs filter the feed only; they do not change event records or
signup behavior.

Recurring shifts can select one or more weekdays. Weekly schedules materialize an
occurrence on each selected weekday; biweekly schedules repeat the selected weekdays
every other week. Legacy records with a single `recurrenceWeekday` remain editable.

## Keep This Split Stable

- `EventAdminWorkspace.vue` is the admin list/form shell.
- `useEventAdmin.ts` owns the editable draft, validation, save, and delete flow.
- `eventAdmin.data.ts` owns the shared event record mapping and slot conversion logic.
- Admin entry routes live under `/admin/vagter`, `/admin/opgaver`, and `/admin/arrangementer`.
- Those pages are the editable backend versions of the public landing pages.
- Public pages must not become alternate edit surfaces.
- Public landing page refactors must not move admin behavior into `src/components/public`.

## What Can Be Shared

- Shared data mapping and slot normalization can live here.
- Shared UI patterns for admin event editing can be extracted inside the admin feature area.
- Public landing page shells can be refactored independently, as long as they only consume admin data and never replace the admin editor.

## Change Rule

When updating public landing pages, preserve this boundary:

1. Public pages may change layout, composition, and shared public components.
2. Admin pages must remain the editable backend version of the same events.
3. If a change affects both surfaces, update both intentionally instead of letting one drift into the other.
