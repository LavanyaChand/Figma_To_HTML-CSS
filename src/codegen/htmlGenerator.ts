// src/codegen/htmlGenerator.ts
import { DesignNode } from "../core/ir";
import { makeClassName } from "./cssGenerator";

export interface GeneratedHTML {
  html: string;
}

export function generateHTML(root: DesignNode, title: string): GeneratedHTML {
  const canvasClass = "canvas-root";

  const bodyContent = `
<div class="${canvasClass}">
${renderNode(root, 1)}
</div>`;

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="stylesheet" href="styles.css" />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" />
</head>
<body>
  ${bodyContent}
</body>
</html>`;

  return { html };
}

function renderNode(node: DesignNode, depth: number): string {
  const className = makeClassName(node);
  const indent = "  ".repeat(depth);

  if (node.type === "text" && node.text) {
    return `${indent}<div class="${className}">${escapeHtml(
      node.text.characters
    )}</div>`;
  }

  const children = node.children
    .map((c) => renderNode(c, depth + 1))
    .join("\n");

  return `${indent}<div class="${className}">
${children}
${indent}</div>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
