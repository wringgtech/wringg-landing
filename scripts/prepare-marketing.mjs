import fs from "node:fs/promises";
import ts from "typescript";

// Share the production UTM/install-referrer implementation with plain HTML pages.
const source = await fs.readFile(new URL("../src/app/download-links.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ES2020 },
});
await fs.writeFile(new URL("../public/marketing-download-links.js", import.meta.url), outputText);
