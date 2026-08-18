import api from './client'

const handleError = (err) => {
  if (err.response) {
    const { status, data } = err.response;
    throw { status, message: data?.message || "Request failed", raw: data };
  }
  if (err.request) {
    throw { status: null, message: "No response from server — check your API base URL", raw: err.request };
  }
  throw { status: null, message: err.message, raw: err };
};

// Only appends ?language=xx when a language is actually given, so callers
// that don't care about language (e.g. fetching by Mongo _id, which is
// already globally unique regardless of language) don't need to pass one.
const languageParams = (language) => (language ? { params: { language } } : {});

export const createContent = async (payload) => {
  try {
    const res = await api.post("/", payload);
    return res.data;
  } catch (err) {
    handleError(err);
  }
};

export const getAllContents = async (language) => {
  try {
    const res = await api.get("/", languageParams(language));
    return res.data;
  } catch (err) {
    handleError(err);
  }
};

export const getContentById = async (id) => {
  try {
    const res = await api.get(`/${id}`);
    return res.data;
  } catch (err) {
    handleError(err);
  }
};

export const getContentBySlug = async (slug, language) => {
  try {
    const res = await api.get(`/slug/${slug}`, languageParams(language));
    return res.data;
  } catch (err) {
    handleError(err);
  }
};

// GET /:id/block/:blockId?language=xx
export const getBlockById = async (id, blockId, language) => {
  try {
    const res = await api.get(`/${id}/block/${blockId}`, languageParams(language));
    return res.data;
  } catch (err) {
    handleError(err);
  }
};

export const updateContent = async (id, payload) => {
  try {
    const res = await api.put(`/${id}`, payload);
    return res.data;
  } catch (err) {
    handleError(err);
  }
};

export const updateField = async (id, path, value) => {
  try {
    const res = await api.patch(`/${id}/field`, { path, value });
    return res.data;
  } catch (err) {
    handleError(err);
  }
};

// Batch version — sends { patches: [{ path, value }, ...] } in one request,
// so a diff of several changed fields becomes one PATCH + one version bump,
// instead of one round trip per field. (Wrapped in an object rather than a
// bare top-level array — some proxies/WAFs reject bare JSON arrays.)
export const updateFields = async (id, patches) => {
  try {
    const res = await api.patch(`/${id}/field`, { patches });
    return res.data;
  } catch (err) {
    handleError(err);
  }
};

export const replaceBlocks = async (id, blocks) => {
  try {
    const res = await api.patch(`/${id}/blocks`, { blocks });
    return res.data;
  } catch (err) {
    handleError(err);
  }
};

export const publishContent = async (id) => {
  try {
    const res = await api.patch(`/${id}/publish`);
    return res.data;
  } catch (err) {
    handleError(err);
  }
};

export const duplicateContent = async (id) => {
  try {
    const res = await api.post(`/${id}/duplicate`);
    return res.data;
  } catch (err) {
    handleError(err);
  }
};

export const deleteContent = async (id) => {
  try {
    const res = await api.delete(`/${id}`);
    return res;
  } catch (err) {
    handleError(err);
  }
};

//upload to R2 API



export const uploadFileToR2 = async (file, folder = "uploads", onProgress) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  try {
    const { data } = await api.post('/upload/single', formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (evt) => {
        if (onProgress && evt.total) {
          onProgress(Math.round((evt.loaded * 100) / evt.total));
        }
      },
    });
    return data; // { success, url, key, size, mimetype }
  } catch (err) {
    if (err.response) {
      throw { status: err.response.status, message: err.response.data?.message || "Upload failed" };
    }
    throw { status: null, message: err.message };
  }
};