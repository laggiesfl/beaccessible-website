import { describe, expect, it } from 'vitest';

import { evidence, insights, reports, getEvidenceByIds } from '@/lib/knowledge-impact/demo-data';

describe('knowledge impact demo data', () => {
  it('contains enough synthetic reports to demonstrate cross-project intelligence', () => {
    expect(reports.length).toBeGreaterThanOrEqual(6);
    expect(new Set(reports.map((report) => report.programme)).size).toBeGreaterThanOrEqual(3);
  });

  it('keeps every evidence object traceable to a source report and location', () => {
    for (const item of evidence) {
      expect(reports.some((report) => report.id === item.reportId)).toBe(true);
      expect(item.sourceLocation.trim().length).toBeGreaterThan(0);
      expect(item.sourceExcerpt.trim().length).toBeGreaterThan(0);
    }
  });

  it('distinguishes source evidence, calculations and AI interpretation', () => {
    const classes = new Set(evidence.map((item) => item.evidenceClass));
    expect(classes).toContain('Source evidence');
    expect(classes).toContain('Calculated indicator');
    expect(classes).toContain('AI interpretation');
  });

  it('ensures every portfolio insight resolves to supporting evidence', () => {
    for (const insight of insights) {
      expect(getEvidenceByIds(insight.evidenceIds)).toHaveLength(insight.evidenceIds.length);
    }
  });

  it('includes an explicit insufficient-evidence ROI position', () => {
    expect(insights.some((insight) => insight.title.toLowerCase().includes('insufficient') && insight.title.toLowerCase().includes('roi'))).toBe(true);
  });
});
