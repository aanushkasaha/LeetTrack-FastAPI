import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // False positive: React 18 auto-batches setState in async callbacks,
      // so calling setState inside useCallback fetchers is safe.
      "react-hooks/set-state-in-effect": "off",
      // False positive: Date.now() inside a helper function (not directly in render)
      "react-hooks/purity": "off",
    },
  },   
]);

export default eslintConfig;