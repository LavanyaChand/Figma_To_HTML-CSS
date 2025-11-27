// src/index.ts
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fetchFigmaFile } from "./figmaClient";
import { figmaFileToPages } from "./figma/normalize";
import { generateHTML } from "./codegen/htmlGenerator";
import { generateCSS } from "./codegen/cssGenerator";

async function main() {
  const [, , fileKey] = process.argv;

  if (!fileKey) {
    console.error("Usage: npm start -- <FILE_KEY>");
    process.exit(1);
  }

  console.log(`Fetching Figma file: ${fileKey} ...`);
  const figmaFile = await fetchFigmaFile(fileKey);

  const pages = figmaFileToPages(figmaFile);

  const outDir = path.join(process.cwd(), "output");
  fs.mkdirSync(outDir, { recursive: true });

  pages.forEach((page, i) => {
    const safeName = page.name.replace(/[^a-z0-9]+/gi, "_").toLowerCase();
    const htmlOut = path.join(outDir, `${safeName}.html`);
    const cssOut = path.join(outDir, `${safeName}.css`);

    // HERE IS THE FIX: supply page.name
    const html = generateHTML(page.root, page.name);
    const css = generateCSS(page.root);

    fs.writeFileSync(htmlOut, html.html, "utf8");
    fs.writeFileSync(cssOut, css.css, "utf8");

    console.log(`✔ Wrote ${htmlOut}`);
    console.log(`✔ Wrote ${cssOut}`);

    // Also write index.html for the FIRST page
    if (i === 0) {
      fs.writeFileSync(path.join(outDir, `index.html`), html.html, "utf8");
      console.log("✔ Created index.html (alias for first page)");
    }
  });

  console.log(`🎉 Generated ${pages.length} output screens`);
  console.log(`Done.`);
}

main();
