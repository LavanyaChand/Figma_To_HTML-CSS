// src/core/ir.ts

export type DesignNodeType =
  | "frame"
  | "group"
  | "rectangle"
  | "text"
  | "vector"
  | "component"
  | "instance";

export interface RGBA {
  r: number; // 0-1
  g: number;
  b: number;
  a: number; // 0-1
}

export interface LayoutProps {
  x: number;
  y: number;
  width: number;
  height: number;

  // For this assignment we're mostly doing absolute layout:
  position: "absolute" | "relative";

  // Figma auto-layout – we won't lean on it yet, but keep for future:
  layoutMode: "none" | "horizontal" | "vertical";
  gap?: number;
  justifyContent?: "flex-start" | "center" | "flex-end" | "space-between";
  alignItems?: "flex-start" | "center" | "flex-end" | "stretch";
}

export interface Fill {
  type: "solid" | "gradientLinear" | "gradientRadial" | "image" | "other";
  color?: RGBA;
  gradientStops?: GradientStop[];
  gradientHandlePositions?: { x: number; y: number }[];
}

export interface Border {
  color: RGBA;
  width: number;
}

export interface Shadow {
  offsetX: number;
  offsetY: number;
  blurRadius: number;
  spread?: number;
  color: RGBA;
}

export interface StyleProps {
  fills?: Fill[];
  border?: Border;
  borderRadius?: number | [number, number, number, number];
  shadows?: Shadow[];
  opacity?: number;
}

export interface TextProps {
  characters: string;
  fontFamily: string;
  fontSize: number;
  fontWeight?: number;
  lineHeightPx?: number;
  letterSpacing?: number;
  textAlignHorizontal?: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
}

export interface DesignNode {
  id: string;
  name: string;
  type: DesignNodeType;
  children: DesignNode[];

  layout: LayoutProps;
  style: StyleProps;

  text?: TextProps;

  componentKey?: string;
  instanceOf?: string;

  tags?: string[];
}

export interface DesignPage {
  id: string;
  name: string;
  root: DesignNode;
}

export interface GradientStop {
  color: RGBA;
  position: number;
}