// Rebrands the Medusa admin as Cardle at build time (vite plugin).
// - login / invite logo box -> Cardle wordmark
// - "Medusa Admin" / "Welcome to Medusa" texts -> Cardle
// - page title + favicon
import { readFileSync } from "node:fs"
import { join } from "node:path"

// Only read while the admin is being built (medusa build runs from the
// backend root). At runtime (`medusa start` in .medusa/server) the files are
// not there, so this must never throw: it just returns null and skips.
const read = (f, mime) => {
  try {
    return `data:${mime};base64,${readFileSync(join(process.cwd(), "branding", f)).toString("base64")}`
  } catch {
    return null
  }
}

const avatarBox = (logo) => `function AvatarBox({ checked }) {
  return jsx("div", {
    className: "mb-6 flex h-[50px] items-center justify-center",
    children: jsx("img", { src: ${JSON.stringify(logo)}, alt: "Cardle", className: "h-8 w-auto dark:invert" })
  });
}`

export default function cardleAdminBranding() {
  let LOGO, FAVICON
  return {
    name: "cardle-admin-branding",
    enforce: "pre",
    buildStart() {
      LOGO = read("cardle-logo.png", "image/png")
      FAVICON = read("favicon.ico", "image/x-icon")
    },
    transform(code, id) {
      if (!id.includes("@medusajs/dashboard")) return null
      let out = code
      const start = out.indexOf("function AvatarBox({ checked }) {")
      if (start !== -1 && LOGO) {
        // end of the function = first "\n}\n" after it
        const end = out.indexOf("\n}\n", start)
        if (end !== -1) out = out.slice(0, start) + avatarBox(LOGO) + out.slice(end + 2)
      }
      out = out
        .replace(/Welcome to Medusa/g, "Welcome to Cardle")
        .replace(/Medusa Admin/g, "Cardle Admin")
      return out === code ? null : { code: out, map: null }
    },
    transformIndexHtml(html) {
      let out = html.replace("</head>", "  <title>Cardle Admin</title>\n</head>")
      if (FAVICON) out = out.replace(/<link rel="icon"[^>]*>/, `<link rel="icon" href="${FAVICON}" />`)
      return out
    },
  }
}
