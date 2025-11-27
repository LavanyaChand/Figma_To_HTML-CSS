// src/figma/normalize.ts
import {
  DesignNode,
  DesignNodeType,
  DesignPage,
  Fill,
  LayoutProps,
  RGBA,
  StyleProps,
  TextProps,
} from "../core/ir";

/**
 * Turn a Figma file JSON into our page + node IR.
 * One DesignPage per CANVAS; root is the first FRAME on that canvas.
 * (HTML generator decides whether to output one file or many.)
 */
export function figmaFileToPages(figmaFile: any): DesignPage[] {
  const document = figmaFile.document;
  if (!document || !Array.isArray(document.children)) {
    throw new Error("Invalid Figma file: missing document.children");
  }

  const canvases = document.children.filter((n: any) => n.type === "CANVAS");

  return canvases.map((pageNode: any) => {
    const frames = (pageNode.children || []).filter(
      (c: any) => c.type === "FRAME"
    );
    if (!frames.length) {
      throw new Error(`Page "${pageNode.name}" has no frames`);
    }

    // use the first frame on this canvas as the root.
    //
    const frameNode = frames[0];
    const frameBox = frameNode.absoluteBoundingBox || {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    };

    const root = normalizeNode(frameNode, frameBox, true);

    return {
      id: pageNode.id,
      name: pageNode.name,
      root,
    };
  });
}

/**
 * parentBox is ALWAYS the absoluteBoundingBox of this node's parent
 * (for the root we pass its own box).
 */
function normalizeNode(
  node: any,
  parentBox: any,
  isRoot: boolean = false
): DesignNode {
  const box = node.absoluteBoundingBox || parentBox;

  const layout = extractLayout(node, box, parentBox, isRoot);
  const style = extractStyle(node);
  const text = node.type === "TEXT" ? extractText(node) : undefined;

  const children = (node.children || []).map((child: any) =>
    // IMPORTANT: pass *this* node's box as parentBox for children
    normalizeNode(child, box, false)
  );

  return {
    id: node.id,
    name: node.name,
    type: mapNodeType(node.type),
    children,
    layout,
    style,
    text,
    componentKey: node.componentId,
    instanceOf: node.type === "INSTANCE" ? node.componentId : undefined,
  };
}

function mapNodeType(figmaType: string): DesignNodeType {
  switch (figmaType) {
    case "FRAME":
      return "frame";
    case "GROUP":
      return "group";
    case "RECTANGLE":
      return "rectangle";
    case "TEXT":
      return "text";
    case "VECTOR":
      return "vector";
    case "COMPONENT":
      return "component";
    case "INSTANCE":
      return "instance";
    default:
      return "group";
  }
}

/**
 * Compute layout.x / layout.y RELATIVE TO parentBox.
 */
function extractLayout(
  node: any,
  box: any,
  parentBox: any,
  isRoot: boolean
): LayoutProps {
  const layoutMode =
    node.layoutMode === "HORIZONTAL"
      ? "horizontal"
      : node.layoutMode === "VERTICAL"
      ? "vertical"
      : "none";

  if (isRoot) {
    // Root frame anchored at (0,0)
    return {
      x: 0,
      y: 0,
      width: box.width ?? 0,
      height: box.height ?? 0,
      position: "relative",
      layoutMode,
      gap: 0,
      justifyContent: "flex-start",
      alignItems: "flex-start",
    };
  }

  const rawX = box.x ?? 0;
  const rawY = box.y ?? 0;
  const parentX = parentBox.x ?? 0;
  const parentY = parentBox.y ?? 0;

  return {
    x: rawX - parentX, // relative to parent
    y: rawY - parentY, // relative to parent
    width: box.width ?? 0,
    height: box.height ?? 0,
    position: "absolute",
    layoutMode,
    gap: node.itemSpacing ?? 0,
    justifyContent: mapPrimaryAxis(node.primaryAxisAlignItems),
    alignItems: mapCounterAxis(node.counterAxisAlignItems),
  };
}

function mapPrimaryAxis(
  value: string | undefined
): LayoutProps["justifyContent"] {
  switch (value) {
    case "CENTER":
      return "center";
    case "MAX":
      return "flex-end";
    case "SPACE_BETWEEN":
      return "space-between";
    case "MIN":
    default:
      return "flex-start";
  }
}

function mapCounterAxis(
  value: string | undefined
): LayoutProps["alignItems"] {
  switch (value) {
    case "CENTER":
      return "center";
    case "MAX":
      return "flex-end";
    case "STRETCH":
      return "stretch";
    case "MIN":
    default:
      return "flex-start";
  }
}

/* ---------- styles ---------- */

function extractStyle(node: any): StyleProps {
  const fills: Fill[] | undefined = Array.isArray(node.fills)
    ? node.fills
        .filter((f: any) => f.visible !== false)
        .map((f: any) => ({
          type: mapFillType(f.type),
          color: f.color
            ? figmaColorToRgba(f.color, f.opacity ?? f.color.a ?? 1)
            : undefined,
          gradientStops: Array.isArray(f.gradientStops)
            ? f.gradientStops.map((s: any) => ({
                color: figmaColorToRgba(
                  s.color,
                  s.color?.a ?? 1
                ),
                position: s.position,
              }))
            : undefined,
          gradientHandlePositions: f.gradientHandlePositions,
        }))
    : undefined;

  let border: StyleProps["border"] | undefined;

  if (
    Array.isArray(node.strokes) &&
    node.strokes.length > 0 &&
    node.strokeWeight
  ) {
    const stroke = node.strokes[0];
    if (stroke && stroke.visible !== false && stroke.color) {
      border = {
        color: figmaColorToRgba(
          stroke.color,
          stroke.opacity ?? stroke.color.a ?? 1
        ),
        width: node.strokeWeight,
      };
    }
  }

  const style: StyleProps = {
    fills,
    border,
    borderRadius: extractCornerRadius(node),
    opacity: node.opacity ?? 1,
  };

  if (Array.isArray(node.effects) && node.effects.length) {
    style.shadows = node.effects
      .filter((e: any) => e.type === "DROP_SHADOW" && e.visible !== false)
      .map((e: any) => ({
        offsetX: e.offset?.x ?? 0,
        offsetY: e.offset?.y ?? 0,
        blurRadius: e.radius ?? 0,
        spread: 0,
        color: figmaColorToRgba(e.color, e.color?.a ?? 1),
      }));
  }

  return style;
}

function mapFillType(figmaType: string): Fill["type"] {
  switch (figmaType) {
    case "SOLID":
      return "solid";
    case "GRADIENT_LINEAR":
      return "gradientLinear";
    case "GRADIENT_RADIAL":
      return "gradientRadial";
    case "IMAGE":
      return "image";
    default:
      return "other";
  }
}

/**
 * Safe color conversion – handles undefined colors gracefully.
 */
function figmaColorToRgba(color: any | undefined, opacity: number): RGBA {
  if (!color) {
    // Fallback: transparent black; avoids crashes on weird nodes
    return { r: 0, g: 0, b: 0, a: opacity };
  }
  return {
    r: color.r ?? 0,
    g: color.g ?? 0,
    b: color.b ?? 0,
    a: opacity,
  };
}

function extractCornerRadius(
  node: any
): number | [number, number, number, number] | undefined {
  if (typeof node.cornerRadius === "number") {
    return node.cornerRadius;
  }

  if (node.rectangleCornerRadii && Array.isArray(node.rectangleCornerRadii)) {
    const [tl, tr, br, bl] = node.rectangleCornerRadii;
    return [tl, tr, br, bl];
  }

  return undefined;
}

/* ---------- text ---------- */

function extractText(node: any): TextProps {
  const s = node.style || {};
  return {
    characters: node.characters ?? "",
    fontFamily: s.fontFamily ?? "System",
    fontSize: s.fontSize ?? 16,
    fontWeight: s.fontWeight,
    lineHeightPx: s.lineHeightPx,
    letterSpacing: s.letterSpacing,
    textAlignHorizontal: s.textAlignHorizontal,
  };
}
