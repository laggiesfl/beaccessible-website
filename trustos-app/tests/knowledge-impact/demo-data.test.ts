import { describe, expect, it } from 'vitest';

import {
  evidence,
  insights,
  reports,
  getEvidenceByIds,
  learningNotes,
  periodComparisons,
  managementQuestions,
} from '@/lib/knowledge-impact/demo-data';

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

  it('includes reusable learning notes with evidence provenance', () => {
    expect(learningNotes.length).toBeGreaterThanOrEqual(3);
    for (const note of learningNotes) {
      expect(note.evidenceIds.length).toBeGreaterThan(0);
      expect(getEvidenceByIds(note.evidenceIds)).toHaveLength(note.evidenceIds.length);
    }
  });

  it('compares at least one project across reporting periods without implying causality', () => {
    expect(periodComparisons.length).toBeGreaterThan(0);
    expect(periodComparisons.some((comparison) => comparison.periods.length >= 2)).toBe(true);
    expect(periodComparisons.every((comparison) => comparison.caveat.toLowerCase().includes('not'))).toBe(true);
  });

  it('surfaces both evidence gaps and contradictory evidence for management review', () => {
    expect(evidence.some((item) => item.category === 'Evidence gap')).toBe(true);
    expect(evidence.some((item) => item.category === 'Contradictory evidence')).toBe(true);
  });

  it('provides management questions linked to evidence or evidence-gap positions', () => {
    expect(managementQuestions.length).toBeGreaterThanOrEqual(4);
    for (const question of managementQuestions) {
      expect(question.answer.trim().length).toBeGreaterThan(0);
      expect(question.evidenceIds.length).toBeGreaterThan(0);
      expect(getEvidenceByIds(question.evidenceIds)).toHaveLength(question.evidenceIds.length);
    }
  });
});
