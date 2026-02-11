import type { ConfigFile } from "@rtk-query/codegen-openapi";

const config: ConfigFile = {
  schemaFile: "swagger.json",
  apiFile: "./emptyApi.ts",
  apiImport: "emptySplitApi",
  outputFile: "./ArNextAPI.ts",
  exportName: "ArNextAPI",
  hooks: true,
};

export default config;
