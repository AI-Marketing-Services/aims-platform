import { defineConfig } from "eslint/config";

const eslintConfig = defineConfig([
  {
    rules: {},
    ignores: [".next/**", "out/**", "build/**", "node_modules/**"],
  },
]);

export default eslintConfig;
