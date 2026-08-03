// In production nginx forwards same-origin /api requests to the backend.
// REACT_APP_API_BASE can still override this for local development builds.
export const API_BASE = process.env.REACT_APP_API_BASE || "/api";
