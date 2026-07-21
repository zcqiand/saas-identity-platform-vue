import tseslint from "typescript-eslint";
import vue from "eslint-plugin-vue";
import vueParser from "vue-eslint-parser";

/**
 * Vue 仓静态检查。React 姊妹仓有的硬约束（no-explicit-any、ban-ts-comment）
 * 在此也开 —— 业务契约双栈一致，TS 约束也一致。
 *
 * Vue 特性约束靠 eslint-plugin-vue。
 */
export default tseslint.config(
  { ignores: ["dist", "node_modules", "coverage", "public/mockServiceWorker.js"] },
  ...tseslint.configs.recommended,
  ...vue.configs["flat/recommended"],
  {
    files: ["**/*.vue"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        sourceType: "module",
        extraFileExtensions: [".vue"],
      },
    },
  },
  {
    files: ["src/**/*.{ts,vue}", "tests/**/*.{ts,vue}"],
    rules: {
      // 项目 CLAUDE.md 硬约束
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      // Vue 常见噪音关掉
      "vue/multi-word-component-names": "off",
      "vue/no-v-html": "off",
    },
  },
  {
    files: ["tests/**/*.{ts,vue}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
);
