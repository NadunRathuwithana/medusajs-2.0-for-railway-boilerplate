module.exports = {
  extends: ["next", "next/core-web-vitals"],
  rules: {
    // Cosmetic: apostrophes and quotes in JSX text render fine.
    "react/no-unescaped-entities": "off",
    // False positives: this app uses the App Router, not pages/.
    "@next/next/no-html-link-for-pages": "off",
  },
};
