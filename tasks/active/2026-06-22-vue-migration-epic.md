# Vue migration epic

Status: active

## Goal
Move the current static Firebase-hosted frontend toward a structured Vue 3 application without breaking the live site.

## Scope
- Create a standalone Vue 3 + Vite app scaffold
- Introduce route-based page structure for the main product areas
- Keep the existing `public/` site intact during migration
- Prepare a clearer feature/component separation for future Firestore work

## Notes
- This is a parallel foundation, not a destructive rewrite
- Hosting cutover is intentionally deferred until the scaffold is validated

