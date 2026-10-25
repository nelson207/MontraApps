import type { ConfigFile } from "@rtk-query/codegen-openapi";

const config: ConfigFile = {
  schemaFile: "swagger.json",
  apiFile: "../emptyApi.ts",
  apiImport: "emptySplitApi",
  outputFile: "./MontraPOSApi.ts",
  exportName: "MontraPOSApi",
  hooks: true,
};

export default config;
