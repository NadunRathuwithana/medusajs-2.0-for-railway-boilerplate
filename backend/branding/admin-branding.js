// Rebrands the Medusa admin as Cardle at build time (vite plugin).
// - login / invite logo box -> Cardle wordmark
// - "Medusa Admin" / "Welcome to Medusa" texts -> Cardle
// - page title + favicon
import { readFileSync } from "node:fs"
import { join } from "node:path"

// medusa build / start run from the backend root
const here = join(process.cwd(), "branding")
const b64 = (f) => readFileSync(join(here, f)).toString("base64")
const LOGO = `data:image/png;base64,${b64("cardle-logo.png")}`
const FAVICON = `data:image/x-icon;base64,${b64("favicon.ico")}`

const AVATAR_BOX = `function AvatarBox({ checked }) {
  return jsx("div", {
    className: "mb-6 flex h-[50px] items-center justify-center",
    children: jsx("img", { src: ${JSON.stringify(LOGO)}, alt: "Cardle", className: "h-8 w-auto dark:invert" })
  });
}`

export default function cardleAdminBranding() {
  return {
    name: "cardle-admin-branding",
    enforce: "pre",
    transform(code, id) {
      if (!id.includes("@medusajs/dashboard")) return null
      let out = code
      const start = out.indexOf("function AvatarBox({ checked }) {")
      if (start !== -1) {
        // end of the function = first "\n}\n" after it
        const end = out.indexOf("\n}\n", start)
        if (end !== -1) out = out.slice(0, start) + AVATAR_BOX + out.slice(end + 2)
      }
      out = out
        .replace(/Welcome to Medusa/g, "Welcome to Cardle")
        .replace(/Medusa Admin/g, "Cardle Admin")
      return out === code ? null : { code: out, map: null }
    },
    transformIndexHtml(html) {
      return html
        .replace(/<link rel="icon"[^>]*>/, `<link rel="icon" href="${FAVICON}" />`)
        .replace("</head>", "  <title>Cardle Admin</title>\n</head>")
    },
  }
}
