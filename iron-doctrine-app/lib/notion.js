// =====================================================================
//  lib/notion.js — CUTOVER SHIM
//  The data layer now lives in lib/db.js (Postgres). This file re-exports
//  it so all existing imports keep working with zero changes.
//  The original Notion implementation is preserved in lib/notion.legacy.js
//  (and git history) as a rollback fallback.
// =====================================================================
export * from "./db.js";
