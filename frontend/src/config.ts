// `npm start` talks directly to the locally running backend. In production,
// nginx forwards same-origin /api requests to the backend container.
export const API_BASE =
  process.env.REACT_APP_API_BASE ||
  (process.env.NODE_ENV === "development" ? "http://localhost:3011" : "/api");
