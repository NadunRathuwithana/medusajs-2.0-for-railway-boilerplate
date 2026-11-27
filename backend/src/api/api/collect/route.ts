// Medusa serves this file at /api/collect, which is the URL Onepay may be
// configured to call. The hardened handler lives in src/api/collect (served at
// /collect); re-export it so both URLs behave identically.
export { POST, GET, PUT, PATCH, DELETE } from "../../collect/route"
