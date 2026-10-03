import { z } from "zod";

const text = z.string().max(10000);
/** Shared report shape prevents a failed or malformed response from appearing as a live scan. */
export const RadarReportSchema = z.object({
  marketOverview: text,
  scannedAt: z.string().datetime(),
  reissueAlerts: z.array(z.object({
    id: z.string().min(1).max(128), productName: text, manufacturer: text, franchise: text,
    status: text, statusBadge: text, confidence: text, estimatedWindow: text,
    suggestedAction: text, projectedMargin: text, reasoning: text,
  })).max(50),
  hotTrends: z.array(text).max(50),
  urgentRecommendations: z.array(text).max(50),
});
export type RadarReport = z.infer<typeof RadarReportSchema>;
