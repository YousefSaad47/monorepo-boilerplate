/**
 * @filename: lint-staged.config.js
 * @type {import('lint-staged').Configuration}
 */
export default {
  "**/*.{ts,tsx}": ["biome lint", "biome format", "biome check"],
  "**/*.json": "biome format",
};
