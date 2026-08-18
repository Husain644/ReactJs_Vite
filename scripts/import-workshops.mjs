// scripts/import-workshops.mjs
//
// Bulk-imports workshop objects from a JS data file (like the one you have,
// exporting `content = [ {...welding}, {...carpentry}, {...paint} ]`) straight
// into the CMS via the real Content API. No JSON conversion needed — Node can
// import valid JS/ESM modules directly.
//
// Usage:
//   1. Save your pasted data as scripts/workshopsData.js, keeping the
//      `export const content = [ ... ];` wrapper exactly as you have it.
//   2. Run:  node scripts/import-workshops.mjs
//
// What it does for each workshop:
//   - POSTs the top-level fields (id, type, title, accent, accentBg,
//     thumbnail) with blocks: [] first — mirrors request #1 in your
//     Postman collection.
//   - PATCHes /:_id/blocks with the full nested blocks tree — mirrors
//     request #14 (Replace Blocks).
//   - Skips (reports, doesn't crash) any workshop whose slug already
//     exists — matches the 409 behaviour in request #2 of your collection.

import { content } from "./workshopsData.js";

const BASE_URL = "https://www.techtt.site/api/content";

async function postJSON(path, body, method = "POST") {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(json?.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

async function importWorkshop(workshop) {
  const { blocks, ...meta } = workshop;

  console.log(`\n→ ${meta.id} ("${meta.title}") — ${blocks?.length ?? 0} top-level blocks`);

  let created;
  try {
    created = await postJSON("", { ...meta, blocks: [] });
  } catch (err) {
    if (err.status === 409) {
      console.log(`  skipped — slug "${meta.id}" already exists`);
      return;
    }
    console.error(`  FAILED to create: ${err.message}`);
    return;
  }

  const _id = created.data._id;
  console.log(`  created _id = ${_id}`);

  try {
    const replaced = await postJSON(`/${_id}/blocks`, { blocks }, "PATCH");
    console.log(`  blocks saved — version ${replaced.data.version}`);
  } catch (err) {
    console.error(`  FAILED to save blocks: ${err.message}`);
  }
}

async function run() {
  console.log(`Importing ${content.length} workshop(s) to ${BASE_URL} ...`);
  for (const workshop of content) {
    // eslint-disable-next-line no-await-in-loop
    await importWorkshop(workshop);
  }
  console.log("\nDone.");
}

run();
