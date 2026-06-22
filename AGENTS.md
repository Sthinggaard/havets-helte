# AGENTS.md

This file is the operating guide for Codex in this repository. Read it before making changes.

## Purpose

This project is a public school/scout-style app built around Firebase. The product needs to stay simple, cheap to run, and easy to extend without turning into a copy-paste pile.

## Working Rules

1. Prefer the smallest safe change.
2. Inspect existing files before editing.
3. Do not create duplicate implementations for the same feature.
4. Keep UI, data access, and admin behavior separated.
5. Do not introduce autonomous actions that a human should approve.
6. Do not claim a task is done until the relevant checks have been run or the limitation is stated clearly.

## Product Principles

- The system should help humans create, organize, and check in data.
- Humans make the final decision on writes, removals, publishing, and sharing.
- Do not add hidden automation that deletes, promotes, or mutates data without explicit user action.
- Keep explanations short and the UI self-explanatory. Do not use helper text to patch a confusing layout.

## Firebase and Cost Rules

- Treat Firestore reads and writes as scarce.
- Prefer one-time reads over live listeners unless the screen truly needs live state.
- Avoid repeated N+1 reads in lists, calendars, libraries, and attendance views.
- Load only the data a screen needs.
- If a screen becomes expensive, normalize the data or cache the derived result once.
- Keep public writes behind trusted backend paths when the action needs validation or capacity control.

## Structure Rules

- Shared look and feel belongs in shared files, not copied into many pages.
- If a UI pattern repeats, extract it once and reuse it.
- Keep page files thin.
- Put feature logic in feature-specific files, not in the page markup.
- Put Firebase setup in one place and import it everywhere else.
- Do not create parallel old/new versions of the same screen.

## UI Rules

- Match the primary task first. Secondary information should not compete with the main action.
- On small screens, the main action must be visible without hunting.
- Keep filter controls compact when they are only supporting the main task.
- If a panel grows too tall, make the content inside it scroll instead of letting the whole layout spill out.

## Security Rules

- Preserve auth checks and role checks.
- Preserve Firestore and storage rules.
- Do not weaken rules or bypass them to make a screen work.
- Do not expose admin actions in public screens.

## Change Discipline

- Change the fewest files needed.
- If a feature needs a new structure, create it directly instead of stretching unrelated files.
- Avoid broad refactors unless the user explicitly asks for one.
- When changing shared behavior, update all dependent screens together.

## Git Rules

- Do not deploy unless explicitly asked.
- Commit meaningful work before handing it off.
- Push only when the user asks or the task requires it.

## If Unsure

- Ask before inventing missing product rules.
- Prefer the existing project shape if it is already working.
- When there is a conflict between convenience and control, choose control.
