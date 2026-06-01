import { tool } from "@langchain/core/tools";
import { z } from "zod";
import {
  fetchCompanyBundle,
  getSectorStats,
  getSymbols,
  resolveUniverse,
} from "./dataService";
import { isShariahCompliant, shariahExplanation } from "./shariah";
import { getFundamentals } from "./psxterminalClient";

export const getSymbolsTool = tool(
  async () => {
    const symbols = await getSymbols();
    return JSON.stringify({ count: symbols.length, sample: symbols.slice(0, 50) });
  },
  {
    name: "get_psx_symbols",
    description: "List PSX ticker symbols (sample + count).",
  }
);

export const getFundamentalsTool = tool(
  async ({ symbol }) => {
    const f = await getFundamentals(symbol);
    return JSON.stringify(f);
  },
  {
    name: "get_psx_fundamentals",
    description: "Fundamentals for one PSX symbol: P/E, dividend yield, Shariah flag, indices.",
    schema: z.object({ symbol: z.string() }),
  }
);

export const getCompanyBundleTool = tool(
  async ({ symbol }) => {
    const bundle = await fetchCompanyBundle(symbol);
    return JSON.stringify(bundle);
  },
  {
    name: "get_psx_company_bundle",
    description:
      "Full data bundle: fundamentals, dividends, price history, company info, announcements, freshness.",
    schema: z.object({ symbol: z.string() }),
  }
);

export const getSectorStatsTool = tool(
  async () => JSON.stringify(await getSectorStats()),
  {
    name: "get_psx_sector_stats",
    description: "Sector-level market aggregates for PSX.",
  }
);

export const resolveUniverseTool = tool(
  async ({ shariahOnly, sectorPreferences, maxCandidates }) => {
    const symbols = await resolveUniverse({
      shariahOnly,
      sectorPreferences: sectorPreferences ?? [],
      maxCandidates: maxCandidates ?? 25,
    });
    return JSON.stringify({ symbols });
  },
  {
    name: "resolve_psx_universe",
    description: "Select candidate symbols for screening based on profile filters.",
    schema: z.object({
      shariahOnly: z.boolean(),
      sectorPreferences: z.array(z.string()).optional(),
      maxCandidates: z.number().optional(),
    }),
  }
);

export const getShariahStatusTool = tool(
  async ({ symbol }) => {
    const f = await getFundamentals(symbol);
    return JSON.stringify({
      symbol,
      compliant: isShariahCompliant(f),
      explanation: shariahExplanation(f),
      isNonCompliant: f.isNonCompliant,
      listedIn: f.listedIn,
    });
  },
  {
    name: "get_psx_shariah_status",
    description: "Shariah compliance status and KMI screening explanation for a symbol.",
    schema: z.object({ symbol: z.string() }),
  }
);

export const psxTools = [
  getSymbolsTool,
  getFundamentalsTool,
  getCompanyBundleTool,
  getSectorStatsTool,
  resolveUniverseTool,
  getShariahStatusTool,
];
