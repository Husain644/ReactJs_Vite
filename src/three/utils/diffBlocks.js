// Produces the smallest set of { path, value } patches needed to turn
// `oldTree` into `newTree`, using Mongo-style dot paths (e.g.
// "blocks.1.items.0.blocks.0.text") so they can be sent straight to
// PATCH /:id/field.
//
// Strategy: recurse only while both sides are the "same shape" (both plain
// objects with identical key sets, or both arrays of identical length).
// The moment shapes diverge — an array grew/shrank, an object gained or
// lost a key, or the type changed — that whole subtree is emitted as a
// single patch at its own path instead of being recursed into further.
// This keeps a plain text edit deep in the tree down to one tiny patch,
// while still handling structural edits (added/removed blocks) correctly
// as one larger — but still far smaller than the whole document — patch.

function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function sameKeySet(a, b) {
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => Object.prototype.hasOwnProperty.call(b, k));
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  if (isPlainObject(a) || isPlainObject(b)) {
    if (!isPlainObject(a) || !isPlainObject(b)) return false;
    if (!sameKeySet(a, b)) return false;
    return Object.keys(a).every((k) => deepEqual(a[k], b[k]));
  }
  return false;
}

export function diffToFieldPatches(oldTree, newTree, basePath = "blocks") {
  const patches = [];

  function walk(oldNode, newNode, path) {
    if (deepEqual(oldNode, newNode)) return;

    const bothArrays = Array.isArray(oldNode) && Array.isArray(newNode);
    const bothObjects = isPlainObject(oldNode) && isPlainObject(newNode);

    if (bothArrays && oldNode.length === newNode.length) {
      oldNode.forEach((_, i) => walk(oldNode[i], newNode[i], `${path}.${i}`));
      return;
    }

    if (bothObjects && sameKeySet(oldNode, newNode)) {
      Object.keys(oldNode).forEach((k) => walk(oldNode[k], newNode[k], `${path}.${k}`));
      return;
    }

    // Shapes diverge (or this is a leaf) — patch this whole subtree in one go.
    patches.push({ path, value: newNode });
  }

  walk(oldTree, newTree, basePath);
  return patches;
}
