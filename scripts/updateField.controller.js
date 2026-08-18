// PATCH /:id/field  — targeted write to one or many dot-paths INSIDE the
// blocks tree only. Backward compatible with the original single-patch
// contract; also accepts a batch via { patches: [...] } so a diffed set of
// small edits can be saved in one request (one version bump) instead of
// one round trip per changed field.
//
// IMPORTANT: the batch body is wrapped in an object — { patches: [...] } —
// rather than sent as a bare top-level JSON array. A bare array body to
// this endpoint was observed returning 404 in front of this app (curl
// with { path, value } => 200, curl with a bare [ { path, value } ] => 404,
// same route/method) — almost certainly a WAF/CDN/reverse-proxy rule
// rejecting top-level JSON arrays rather than anything in this handler.
// Wrapping in an object sidesteps it entirely.
//
// body (single, original contract):
//   { path: "blocks.2.items.0.blocks.5", value: {...} }
//
// body (batch, new):
//   { patches: [
//       { path: "blocks.1.items.0.blocks.0.text", value: "..." },
//       { path: "blocks.2.title", value: "..." }
//   ] }
export const updateField = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid id",
      });
    }

    // Normalize both contracts into a single array of { path, value }.
    const patches = Array.isArray(req.body?.patches)
      ? req.body.patches
      : [req.body];

    if (patches.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one { path, value } patch is required",
      });
    }

    const setObject = {};
    const seenPaths = new Set();

    for (const patch of patches) {
      const { path, value } = patch || {};

      if (!isSafeBlocksPath(path)) {
        return res.status(400).json({
          success: false,
          message:
            `Invalid path "${path}". Each 'path' must be a string starting with 'blocks.' ` +
            `(or exactly 'blocks') and cannot target protected keys.`,
        });
      }

      if (value === undefined) {
        return res.status(400).json({
          success: false,
          message: `'value' is required for path "${path}"`,
        });
      }

      // Guard against two patches in the same batch targeting overlapping
      // paths (e.g. "blocks.1" and "blocks.1.text") — Mongo's $set would
      // reject that as a conflicting update path.
      for (const seen of seenPaths) {
        if (path === seen || path.startsWith(`${seen}.`) || seen.startsWith(`${path}.`)) {
          return res.status(400).json({
            success: false,
            message: `Overlapping paths in the same request: "${path}" and "${seen}"`,
          });
        }
      }
      seenPaths.add(path);

      setObject[path] = value;
    }

    const updated = await Content.findByIdAndUpdate(
      req.params.id,
      {
        $set: setObject,
        $inc: { version: 1 }, // one bump per save, not per field
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Content not found",
      });
    }

    res.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
