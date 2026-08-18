// Web port of cms/cms/utils/findItemById.js — walks the block tree looking
// for a node with a matching `path`, and also (new) a matching `id`, since
// several reference shapes in the data use one or the other:
//   carousel item.target        -> path lookup
//   intro_card.readMoreItem     -> { id } lookup
//   resource_list.viewAllItem   -> { id } or { target } lookup

export function findItemByPath(data, path) {
  if (!data || !path) return null;

  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findItemByPath(item, path);
      if (found) return found;
    }
    return null;
  }

  if (data.path === path && Array.isArray(data.blocks)) {
    return data;
  }

  if (data.blocks) {
    const found = findItemByPath(data.blocks, path);
    if (found) return found;
  }

  if (data.items) {
    const found = findItemByPath(data.items, path);
    if (found) return found;
  }

  return null;
}

export function findItemById(data, id) {
  if (!data || !id) return null;

  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findItemById(item, id);
      if (found) return found;
    }
    return null;
  }

  if (data.id === id && Array.isArray(data.blocks)) {
    return data;
  }

  if (data.blocks) {
    const found = findItemById(data.blocks, id);
    if (found) return found;
  }

  if (data.items) {
    const found = findItemById(data.items, id);
    if (found) return found;
  }

  return null;
}

// Resolves any of the reference shapes used across block types
// ({ target } | { id } | the item itself already carrying .blocks).
export function resolveNavRef(root, ref) {
  if (!ref) return null;
  if (Array.isArray(ref.blocks)) return ref; // already a full item
  if (ref.target) return findItemByPath(root, ref.target);
  if (ref.id) return findItemById(root, ref.id);
  return null;
}

// ---------------------------------------------------------------------
// Path-tracking variants, used by Preview's edit mode. Same tree walk as
// above, but also returns the exact dot-path of the match (and of its
// .blocks array), since that's what PATCH /:id/field needs to save just
// the one changed field instead of the whole document.
// ---------------------------------------------------------------------

function walkWithLocation(data, nodePath, matches) {
  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      const found = walkWithLocation(data[i], `${nodePath}.${i}`, matches);
      if (found) return found;
    }
    return null;
  }
  if (data && typeof data === "object") {
    if (matches(data) && Array.isArray(data.blocks)) {
      return { item: data, itemPath: nodePath, blocksPath: `${nodePath}.blocks` };
    }
    if (Array.isArray(data.blocks)) {
      const found = walkWithLocation(data.blocks, `${nodePath}.blocks`, matches);
      if (found) return found;
    }
    if (Array.isArray(data.items)) {
      const found = walkWithLocation(data.items, `${nodePath}.items`, matches);
      if (found) return found;
    }
  }
  return null;
}

export function findItemByPathWithLocation(rootArray, rootBasePath, targetPath) {
  if (!targetPath) return null;
  return walkWithLocation(rootArray, rootBasePath, (node) => node.path === targetPath);
}

export function findItemByIdWithLocation(rootArray, rootBasePath, targetId) {
  if (!targetId) return null;
  return walkWithLocation(rootArray, rootBasePath, (node) => node.id === targetId);
}

// Same idea as resolveNavRef, but for cases where we don't already know
// the target's path from iteration context (carousel target / readMoreItem
// / viewAllItem) — returns { item, itemPath, blocksPath } | null.
export function resolveNavRefWithLocation(rootArray, rootBasePath, ref) {
  if (!ref) return null;
  if (ref.target) return findItemByPathWithLocation(rootArray, rootBasePath, ref.target);
  if (ref.id) return findItemByIdWithLocation(rootArray, rootBasePath, ref.id);
  return null;
}

// Reads a value out of a document given a Mongo-style dot path, e.g.
// getByPath(content, "blocks.0.blocks.2.title") === content.blocks[0].blocks[2].title
export function getByPath(root, path) {
  if (!path) return undefined;
  return path.split(".").reduce((node, key) => (node == null ? undefined : node[key]), root);
}
