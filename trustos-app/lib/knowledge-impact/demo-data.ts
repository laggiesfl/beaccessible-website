export type EvidenceClass = 'Source evidence' | 'Calculated indicator' | 'AI interpretation';
export type ReviewStatus = 'Confirmed' | 'Needs clarification' | 'Interpretation only';

export type EvidenceObject = {
  id: string;
  reportId: string;
  project: string;
  programme: string;
  reportingPeriod: string;
  category: string;
  evidenceClass: EvidenceClass;
  reviewStatus: ReviewStatus;
  statement: string;
  sourceExcerpt: string;
  sourceLocation: string;
};

export type DemoReport = {
  id: string;
  title: string;
  organisation: string;
  project: string;
  programme: string;
  reportingPeriod: string;
  type: string;
  reviewStatus: string;
  summary: string;
};

export type DemoInsight = {
  id: string;
  title: string;
  summary: string;
  evidenceIds: string[];
  evidenceClass: EvidenceClass;
  caveat?: string;
};

export const reports: DemoReport[] = [
  {
    id: 'R-001',
    title: 'Teacher Development Project — Mid-Year Report',
    organisation: 'Learning Futures Network',
    project: 'Teacher Development Project',
    programme: 'Educator Development',
    reportingPeriod: 'Jan–Jun 2026',
    type: 'Narrative + indicators',
    reviewStatus: 'Reviewed',
    summary: 'Reports strong training participation, improved coaching uptake and recurring transport constraints affecting rural attendance.',
  },
  {
    id: 'R-002',
    title: 'Teacher Development Project — Annual Report',
    organisation: 'Learning Futures Network',
    project: 'Teacher Development Project',
    programme: 'Educator Development',
    reportingPeriod: '2025',
    type: 'Annual narrative report',
    reviewStatus: 'Reviewed',
    summary: 'Reports improved educator confidence alongside uneven school-level implementation capacity.',
  },
  {
    id: 'R-003',
    title: 'STEM Learning Initiative — Progress Report',
    organisation: 'Future Classrooms Trust',
    project: 'STEM Learning Initiative',
    programme: 'Learner Achievement',
    reportingPeriod: 'Q2 2026',
    type: 'Progress report',
    reviewStatus: 'Reviewed',
    summary: 'Reports stronger learner participation and improved teacher use of practical STEM activities, with timetable pressure identified as a recurring barrier.',
  },
  {
    id: 'R-004',
    title: 'School Leadership Programme — Outcome Review',
    organisation: 'Education Leadership Partnership',
    project: 'School Leadership Programme',
    programme: 'System Leadership',
    reportingPeriod: '2026',
    type: 'Outcome review',
    reviewStatus: 'Reviewed',
    summary: 'Reports more consistent instructional-leadership routines but mixed evidence on downstream learner outcomes.',
  },
  {
    id: 'R-005',
    title: 'Rural Schools Support — Implementation Update',
    organisation: 'Rural Learning Collaborative',
    project: 'Rural Schools Support',
    programme: 'Learner Achievement',
    reportingPeriod: 'Jan–Jun 2026',
    type: 'Implementation update',
    reviewStatus: 'Needs clarification',
    summary: 'Reports stable participation but incomplete baseline data for one outcome indicator and recurring travel constraints.',
  },
  {
    id: 'R-006',
    title: 'Foundation Portfolio Learning Note',
    organisation: 'Synthetic Portfolio Office',
    project: 'Cross-Portfolio Learning',
    programme: 'Portfolio Learning',
    reportingPeriod: '2026',
    type: 'Learning note',
    reviewStatus: 'Reviewed',
    summary: 'Synthesises repeated implementation themes across the demonstration dataset without making causal claims.',
  },
];

export const evidence: EvidenceObject[] = [
  {
    id: 'E-001',
    reportId: 'R-001',
    project: 'Teacher Development Project',
    programme: 'Educator Development',
    reportingPeriod: 'Jan–Jun 2026',
    category: 'Outcome',
    evidenceClass: 'Source evidence',
    reviewStatus: 'Confirmed',
    statement: '82% of participating educators completed at least three coaching sessions during the period.',
    sourceExcerpt: 'Eighty-two percent of participating educators completed three or more coaching sessions.',
    sourceLocation: 'Page 8, Coaching participation',
  },
  {
    id: 'E-002',
    reportId: 'R-001',
    project: 'Teacher Development Project',
    programme: 'Educator Development',
    reportingPeriod: 'Jan–Jun 2026',
    category: 'Challenge',
    evidenceClass: 'Source evidence',
    reviewStatus: 'Confirmed',
    statement: 'Travel distance and transport availability reduced attendance for some rural participants.',
    sourceExcerpt: 'Transport availability and long travel distances remained barriers for a group of rural participants.',
    sourceLocation: 'Page 11, Implementation challenges',
  },
  {
    id: 'E-003',
    reportId: 'R-003',
    project: 'STEM Learning Initiative',
    programme: 'Learner Achievement',
    reportingPeriod: 'Q2 2026',
    category: 'Outcome',
    evidenceClass: 'Source evidence',
    reviewStatus: 'Confirmed',
    statement: 'Learner participation in practical STEM activities increased from 61% to 74% in the reported cohort.',
    sourceExcerpt: 'Participation in practical STEM activities rose from 61 percent at baseline to 74 percent in Q2.',
    sourceLocation: 'Page 6, Participation indicator',
  },
  {
    id: 'E-004',
    reportId: 'R-003',
    project: 'STEM Learning Initiative',
    programme: 'Learner Achievement',
    reportingPeriod: 'Q2 2026',
    category: 'Indicator',
    evidenceClass: 'Calculated indicator',
    reviewStatus: 'Confirmed',
    statement: 'Reported practical STEM participation increased by 13 percentage points.',
    sourceExcerpt: 'Calculated from the reported values of 61% and 74%.',
    sourceLocation: 'Calculation based on Page 6 source values',
  },
  {
    id: 'E-005',
    reportId: 'R-004',
    project: 'School Leadership Programme',
    programme: 'System Leadership',
    reportingPeriod: '2026',
    category: 'Outcome',
    evidenceClass: 'Source evidence',
    reviewStatus: 'Confirmed',
    statement: 'School leaders reported more consistent use of instructional-leadership routines.',
    sourceExcerpt: 'Most participating school leaders reported more consistent instructional-leadership routines.',
    sourceLocation: 'Page 10, Leadership practice findings',
  },
  {
    id: 'E-006',
    reportId: 'R-004',
    project: 'School Leadership Programme',
    programme: 'System Leadership',
    reportingPeriod: '2026',
    category: 'Evidence gap',
    evidenceClass: 'Source evidence',
    reviewStatus: 'Needs clarification',
    statement: 'The report does not provide sufficient evidence to attribute changes in learner outcomes to the leadership intervention.',
    sourceExcerpt: 'The current evidence does not support attribution of learner-outcome changes to the programme.',
    sourceLocation: 'Page 15, Limitations',
  },
  {
    id: 'E-007',
    reportId: 'R-005',
    project: 'Rural Schools Support',
    programme: 'Learner Achievement',
    reportingPeriod: 'Jan–Jun 2026',
    category: 'Evidence gap',
    evidenceClass: 'Source evidence',
    reviewStatus: 'Needs clarification',
    statement: 'Baseline data for one learner-outcome indicator is incomplete.',
    sourceExcerpt: 'Baseline records are incomplete for Indicator 3 and comparison should be deferred.',
    sourceLocation: 'Page 7, Indicator notes',
  },
  {
    id: 'E-008',
    reportId: 'R-005',
    project: 'Rural Schools Support',
    programme: 'Learner Achievement',
    reportingPeriod: 'Jan–Jun 2026',
    category: 'Challenge',
    evidenceClass: 'Source evidence',
    reviewStatus: 'Confirmed',
    statement: 'Travel and transport constraints continued to affect implementation in rural sites.',
    sourceExcerpt: 'Travel and transport constraints remained the most common implementation barrier in rural sites.',
    sourceLocation: 'Page 12, Delivery challenges',
  },
  {
    id: 'E-009',
    reportId: 'R-002',
    project: 'Teacher Development Project',
    programme: 'Educator Development',
    reportingPeriod: '2025',
    category: 'Learning',
    evidenceClass: 'Source evidence',
    reviewStatus: 'Confirmed',
    statement: 'School-level implementation capacity varied substantially across participating sites.',
    sourceExcerpt: 'Implementation capacity varied considerably between schools, even where educator participation was strong.',
    sourceLocation: 'Page 14, Lessons learned',
  },
  {
    id: 'E-010',
    reportId: 'R-006',
    project: 'Cross-Portfolio Learning',
    programme: 'Portfolio Learning',
    reportingPeriod: '2026',
    category: 'Theme',
    evidenceClass: 'AI interpretation',
    reviewStatus: 'Interpretation only',
    statement: 'The available reports suggest implementation conditions may be as important as intervention design in explaining uneven results.',
    sourceExcerpt: 'AI-assisted synthesis of E-002, E-008 and E-009. Human review is required before use as organisational learning.',
    sourceLocation: 'Derived synthesis across three source records',
  },
];

export const insights: DemoInsight[] = [
  {
    id: 'I-001',
    title: 'Transport constraints recur across rural delivery contexts',
    summary: 'Two separate projects report travel or transport barriers affecting participation or implementation.',
    evidenceIds: ['E-002', 'E-008'],
    evidenceClass: 'AI interpretation',
    caveat: 'This is a cross-report pattern, not a causal explanation.',
  },
  {
    id: 'I-002',
    title: 'Practical STEM participation increased in the reported cohort',
    summary: 'The source values show an increase from 61% to 74%, equal to 13 percentage points.',
    evidenceIds: ['E-003', 'E-004'],
    evidenceClass: 'Calculated indicator',
  },
  {
    id: 'I-003',
    title: 'Evidence is insufficient for a defensible ROI conclusion',
    summary: 'The current dataset does not contain complete, comparable investment and attributable outcome evidence across programmes.',
    evidenceIds: ['E-006', 'E-007'],
    evidenceClass: 'AI interpretation',
    caveat: 'The demo deliberately refuses to manufacture an ROI claim.',
  },
  {
    id: 'I-004',
    title: 'Implementation capacity appears uneven across sites',
    summary: 'One educator-development report explicitly identifies substantial variation in school-level implementation capacity.',
    evidenceIds: ['E-009'],
    evidenceClass: 'AI interpretation',
    caveat: 'Single-source observation; further evidence is required before generalising.',
  },
];

export function getEvidenceByIds(ids: string[]) {
  return ids.map((id) => evidence.find((item) => item.id === id)).filter((item): item is EvidenceObject => Boolean(item));
}
