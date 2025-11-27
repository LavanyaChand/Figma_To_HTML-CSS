// src/generate.ts
import fs from "fs";
import path from "path";
import { figmaFileToPages } from "./figma/normalize";
import { generateHTML } from "./codegen/htmlGenerator";
import { generateCSS } from "./codegen/cssGenerator";

async function main() {
  const [, , fileKey] = process.argv;
  if (!fileKey) {
    console.error("Usage: npm run generate -- <FIGMA_FILE_KEY>");
    process.exit(1);
  }

  const jsonPath = path.join(process.cwd(), "data", `${fileKey}.json`);
  if (!fs.existsSync(jsonPath)) {
    console.error(`JSON file not found: ${jsonPath}`);
    console.error("Run the fetch step first to download it.");
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const pages = figmaFileToPages(raw);

  // For this assignment, just take the first page
  const page = pages[0];
  const root = page.root;

  const { html } = generateHTML(root, page.name);
  const { css } = generateCSS(root);

  const outDir = path.join(process.cwd(), "output");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(path.join(outDir, "index.html"), html, "utf8");
  fs.writeFileSync(path.join(outDir, "styles.css"), css, "utf8");

  console.log("✅ Generated HTML and CSS in ./output");
}

main();
