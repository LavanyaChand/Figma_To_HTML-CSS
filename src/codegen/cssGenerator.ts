// src/codegen/cssGenerator.ts
import { DesignNode, RGBA, Fill } from "../core/ir";

export interface GeneratedCSS {
  css: string;
}

export function generateCSS(root: DesignNode): GeneratedCSS {
  const rules: string[] = [];

  walk(root, (node, className) => {
    rules.push(buildRuleForNode(node, className));
  });

  const base = `
html, body {
  margin: 0;
  padding: 0;
}

body {
  /* Just center the frame on large screens; does not hard-code design */
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

.canvas-root {
  position: relative;
  overflow: hidden;
  width: ${root.layout.width}px;
  height: ${root.layout.height}px;
}
`;

  return {
    css: base + "\n\n" + rules.join("\n\n"),
  };
}

type Visitor = (node: DesignNode, className: string) => void;

function walk(node: DesignNode, visitor: Visitor) {
  const className = makeClassName(node);
  visitor(node, className);
  node.children.forEach((child) => walk(child, visitor));
}

export function makeClassName(node: DesignNode): string {
  const slug =
    node.name
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "node";

  const idPart = node.id.replace(/[^a-z0-9]/gi, "");
  return `${slug}-${idPart}`;
}

function buildRuleForNode(node: DesignNode, className: string): string {
  const { layout, style, type, text } = node;
  const lines: string[] = [];

  // special-case to hide iOS home indicator rectangles
  if (node.name && /home indicator/i.test(node.name) && node.type === "rectangle") {
    return `.${className} { display: none; }`;
  }

  const isText = type === "text" && !!text;

  // size
  if (layout.width) lines.push(`width: ${layout.width}px;`);
  if (layout.height) lines.push(`height: ${layout.height}px;`);

  // position
  if (layout.position === "absolute") {
    lines.push("position: absolute;");
    lines.push(`left: ${layout.x}px;`);
    lines.push(`top: ${layout.y}px;`);
  } else {
    lines.push("position: relative;");
  }

  // fills: for TEXT use `color`, for others use background / gradient
  const fill = style.fills?.[0];
  if (fill) {
    if (isText && fill.type === "solid" && fill.color) {
      // Text color from Figma fill
      lines.push(`color: ${rgbaToCss(fill.color)};`);
    } else {
      const bg = fillToCss(fill);
      if (bg) lines.push(bg);
    }
  }

  // border
  if (style.border) {
    lines.push(
      `border: ${style.border.width}px solid ${rgbaToCss(
        style.border.color
      )};`
    );
  }


  // border radius
  if (style.borderRadius !== undefined) {
    if (typeof style.borderRadius === "number") {
      lines.push(`border-radius: ${style.borderRadius}px;`);
    } else {
      const [tl, tr, br, bl] = style.borderRadius;
      lines.push(`border-radius: ${tl}px ${tr}px ${br}px ${bl}px;`);
    }
  }

  // shadows
  if (style.shadows && style.shadows.length) {
    const s = style.shadows[0];
    lines.push(
      `box-shadow: ${s.offsetX}px ${s.offsetY}px ${s.blurRadius}px ${s.spread ?? 0}px ${rgbaToCss(
        s.color
      )};`
    );
  }

  // opacity
  if (style.opacity !== undefined && style.opacity < 1) {
    lines.push(`opacity: ${style.opacity};`);
  }

  // text styles
  if (isText && text) {
    lines.push("display: flex;");
    lines.push("align-items: center;");
    lines.push("justify-content: flex-start;");
    lines.push(`font-family: "${text.fontFamily}", system-ui, sans-serif;`);
    lines.push(`font-size: ${text.fontSize}px;`);
    if (text.fontWeight) lines.push(`font-weight: ${text.fontWeight};`);
    if (text.lineHeightPx)
      lines.push(`line-height: ${text.lineHeightPx}px;`);
    if (text.letterSpacing)
      lines.push(`letter-spacing: ${text.letterSpacing}px;`);

    if (text.textAlignHorizontal) {
      const map: Record<string, string> = {
        LEFT: "left",
        CENTER: "center",
        RIGHT: "right",
        JUSTIFIED: "justify",
      };
      const aligned = map[text.textAlignHorizontal] ?? "left";
      lines.push(`text-align: ${aligned};`);
      if (aligned === "center") {
        lines.push("justify-content: center;");
      }
    }

    // keep background transparent for text boxes
    lines.push("background-color: transparent;");
  }

  return `.${className} {\n  ${lines.join("\n  ")}\n}`;
}

function rgbaToCss(color: RGBA): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  return `rgba(${r}, ${g}, ${b}, ${color.a})`;
}

function fillToCss(fill: Fill): string | null {
  if (fill.type === "solid" && fill.color) {
    return `background-color: ${rgbaToCss(fill.color)};`;
  }

  if (
    fill.type === "gradientLinear" &&
    fill.gradientStops &&
    fill.gradientStops.length >= 2
  ) {
    const stops = fill.gradientStops
      .map(
        (s) => `${rgbaToCss(s.color)} ${Math.round((s.position ?? 0) * 100)}%`
      )
      .join(", ");

    // ✅ approximate Figma gradient angle
    let angle = 90; // fallback
    if (fill.gradientHandlePositions && fill.gradientHandlePositions.length >= 2) {
      const [p0, p1] = fill.gradientHandlePositions;
      const dx = p1.x - p0.x;
      const dy = p1.y - p0.y;
      const rad = Math.atan2(dy, dx);
      // CSS: 0deg = pointing up; adjust from Figma’s coordinate system
      angle = ((rad * 180) / Math.PI + 90 + 360) % 360;
    }

    return `background-image: linear-gradient(${angle}deg, ${stops});`;
  }

  return null;
}

