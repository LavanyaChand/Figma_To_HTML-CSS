// src/figmaClient.ts
import axios from "axios";

const FIGMA_API_BASE = "https://api.figma.com/v1";

const FIGMA_TOKEN = process.env.FIGMA_TOKEN;

if (!FIGMA_TOKEN) {
  throw new Error(
    "FIGMA_TOKEN is not set. Add it to your .env file as FIGMA_TOKEN=..."
  );
}

export interface FigmaFileResponse {
  document: any;
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  version: string;
}

export async function fetchFigmaFile(
  fileKey: string
): Promise<FigmaFileResponse> {
  const url = `${FIGMA_API_BASE}/files/${fileKey}`;

  const res = await axios.get<FigmaFileResponse>(url, {
    headers: {
      "X-Figma-Token": FIGMA_TOKEN,
    },
  });

  return res.data;
}
