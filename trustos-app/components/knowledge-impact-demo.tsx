'use client';

import { useMemo, useState } from 'react';

import {
  evidence,
  getEvidenceByIds,
  insights,
  learningNotes,
  managementQuestions,
  periodComparisons,
  reports,
  type EvidenceClass,
} from '@/lib/knowledge-impact/demo-data';

type ViewId = 'overview' | 'reports' | 'portfolio' | 'learning' | 'comparison' | 'management' | 'explorer' | 'provenance';

const views: Array<{ id: ViewId; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'reports', label: 'Report intelligence' },
  { id: 'portfolio', label: 'Portfolio intelligence' },
  { id: 'learning', label: 'Learning library' },
  { id: 'comparison', label: 'Period comparison' },
  { id: 'management', label: 'Management intelligence' },
  { id: 'explorer', label: 'Knowledge explorer' },
  { id: 'provenance', label: 'Evidence traceability' },
];

const logoAlt = 'BeAccessible logo — circular badge with wheelchair user, pram, shopping trolley, and accessibility ramp icons, text reads BEACCESSIBLE CREATING ACCESS FOR ALL';

function EvidenceBadge({ value }: { value: EvidenceClass }) {
  return <span className="ki-badge">{value}</span>;
}

function EvidenceList({ ids }: { ids: string[] }) {
  const items = getEvidenceByIds(ids);

  return (
    <div className="ki-evidence-list">
      {items.map((item) => (
        <details className="ki-evidence-card" key={item.id}>
          <summary>
            <span>{item.id}: {item.category}</span>
            <EvidenceBadge value={item.evidenceClass} />
          </summary>
          <div className="ki-evidence-body">
            <p><strong>Evidence statement:</strong> {item.statement}</p>
            <p><strong>Source excerpt:</strong> {item.sourceExcerpt}</p>
            <p><strong>Source:</strong> {item.reportId} · {item.project} · {item.reportingPeriod}</p>
            <p><strong>Source location:</strong> {item.sourceLocation}</p>
            <p><strong>Review status:</strong> {item.reviewStatus}</p>
          </div>
        </details>
      ))}
    </div>
  );
}

export function KnowledgeImpactDemo() {
  const [activeView, setActiveView] = useState<ViewId>('overview');
  const [selectedReportId, setSelectedReportId] = useState(reports[0].id);
  const [query, setQuery] = useState('');
  const [explorerQuestion, setExplorerQuestion] = useState('What recurring implementation challenges appear across projects?');
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const selectedReport = reports.find((report) => report.id === selectedReportId) ?? reports[0];
  const selectedEvidence = evidence.filter((item) => item.reportId === selectedReport.id);

  const filteredReports = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return reports;
    return reports.filter((report) =>
      [report.title, report.organisation, report.project, report.programme, report.reportingPeriod]
        .join(' ')
        .toLowerCase()
        .includes(needle),
    );
  }, [query]);

  const explorerAnswer = explorerQuestion.toLowerCase().includes('roi')
    ? insights.find((item) => item.id === 'I-003') ?? insights[0]
    : explorerQuestion.toLowerCase().includes('stem')
      ? insights.find((item) => item.id === 'I-002') ?? insights[0]
      : explorerQuestion.toLowerCase().includes('capacity')
        ? insights.find((item) => item.id === 'I-004') ?? insights[0]
        : explorerQuestion.toLowerCase().includes('reconcil') || explorerQuestion.toLowerCase().includes('contradict')
          ? insights.find((item) => item.id === 'I-005') ?? insights[0]
          : insights[0];

  const demoClassName = `ki-demo${highContrast ? ' ki-high-contrast' : ''}${reducedMotion ? ' ki-reduced-motion' : ''}`;

  return (
    <div className={demoClassName}>
      <section className="ki-hero" aria-labelledby="ki-title">
        <div className="ki-brand-lockup">
          <img
            className="ki-brand-logo"
            src="/beaccessible-logo.svg"
            width="96"
            height="96"
            alt={logoAlt}
          />
          <div>
            <p className="ki-brand-name">BeAccessible</p>
            <p className="ki-brand-subtitle">TrustOS / GrantFlow extension</p>
          </div>
        </div>
        <p className="eyebrow">Future-facing demonstration</p>
        <h1 id="ki-title">Knowledge & Impact Intelligence</h1>
        <p className="ki-lead">Turn programme and grantee reporting into structured organisational intelligence.</p>
        <div className="status-message" role="note">
          <strong>Demonstration only:</strong> this prototype uses synthetic data. It does not represent Zenex Foundation data, a procurement decision, or a proposed 2026 implementation.
        </div>
      </section>

      <section className="ki-accessibility-toolbar" aria-label="Display accessibility preferences">
        <strong>Display preferences</strong>
        <div className="ki-accessibility-actions">
          <button
            type="button"
            className="ki-preference-button"
            aria-pressed={highContrast}
            onClick={() => setHighContrast((value) => !value)}
          >
            High contrast
          </button>
          <button
            type="button"
            className="ki-preference-button"
            aria-pressed={reducedMotion}
            onClick={() => setReducedMotion((value) => !value)}
          >
            Reduced motion
          </button>
        </div>
      </section>

      <nav className="ki-view-nav" aria-label="Knowledge and impact demonstration views">
        {views.map((view) => (
          <button
            className="ki-view-button"
            type="button"
            key={view.id}
            aria-pressed={activeView === view.id}
            onClick={() => setActiveView(view.id)}
          >
            {view.label}
          </button>
        ))}
      </nav>

      <div aria-live="polite" className="ki-view-status">
        Showing {views.find((view) => view.id === activeView)?.label} view
      </div>

      {activeView === 'overview' ? (
        <section className="ki-section" aria-labelledby="overview-heading">
          <div className="ki-section-heading">
            <div>
              <p className="eyebrow">From documents to decisions</p>
              <h2 id="overview-heading">What the demonstration shows</h2>
            </div>
          </div>

          <div className="ki-metrics" aria-label="Demonstration dataset summary">
            <article><strong>{reports.length}</strong><span>synthetic reports</span></article>
            <article><strong>{new Set(reports.map((report) => report.project)).size}</strong><span>projects represented</span></article>
            <article><strong>{evidence.length}</strong><span>traceable evidence objects</span></article>
            <article><strong>{learningNotes.length}</strong><span>organisational learning notes</span></article>
          </div>

          <div className="ki-process" aria-label="Evidence intelligence process">
            {['Report intake', 'AI-assisted synthesis', 'Human review', 'Cross-project intelligence', 'Management insight', 'Source traceability'].map((step, index) => (
              <article key={step}>
                <span className="ki-step-number" aria-hidden="true">{index + 1}</span>
                <h3>{step}</h3>
              </article>
            ))}
          </div>

          <div className="ki-grid-two">
            <article className="ki-panel">
              <h3>Evidence integrity is built in</h3>
              <p>Every substantive insight can be opened to show the underlying evidence, report, reporting period, source excerpt and source location.</p>
              <button type="button" className="secondary-button" onClick={() => setActiveView('provenance')}>View evidence traceability</button>
            </article>
            <article className="ki-panel">
              <h3>Learning can accumulate over time</h3>
              <p>Reviewed evidence can be turned into reusable organisational learning without losing the link back to its source.</p>
              <button type="button" className="secondary-button" onClick={() => setActiveView('learning')}>View learning library</button>
            </article>
            <article className="ki-panel">
              <h3>Change over time stays qualified</h3>
              <p>Period comparisons can calculate differences while keeping the limits of non-equivalent periods and causal interpretation visible.</p>
              <button type="button" className="secondary-button" onClick={() => setActiveView('comparison')}>Compare periods</button>
            </article>
            <article className="ki-panel">
              <h3>Uncertainty remains visible</h3>
              <p>The demo distinguishes reported facts, calculated indicators and AI interpretation, and flags evidence gaps or tensions for management review.</p>
              <button type="button" className="secondary-button" onClick={() => setActiveView('management')}>View management intelligence</button>
            </article>
          </div>
        </section>
      ) : null}

      {activeView === 'reports' ? (
        <section className="ki-section" aria-labelledby="reports-heading">
          <div className="ki-section-heading">
            <div>
              <p className="eyebrow">Individual report value</p>
              <h2 id="reports-heading">Report intelligence</h2>
            </div>
          </div>

          <div className="form-field ki-search-field">
            <label htmlFor="report-search">Search the synthetic report library</label>
            <input
              id="report-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by programme, project, organisation or period"
            />
            <p className="field-help">{filteredReports.length} report{filteredReports.length === 1 ? '' : 's'} found.</p>
          </div>

          <div className="ki-report-layout">
            <div className="ki-report-list" aria-label="Synthetic reports">
              {filteredReports.map((report) => (
                <button
                  className="ki-report-button"
                  type="button"
                  key={report.id}
                  aria-pressed={report.id === selectedReport.id}
                  onClick={() => setSelectedReportId(report.id)}
                >
                  <strong>{report.title}</strong>
                  <span>{report.programme} · {report.reportingPeriod}</span>
                </button>
              ))}
            </div>

            <article className="ki-panel ki-report-detail" aria-labelledby="selected-report-title">
              <p className="eyebrow">{selectedReport.id} · {selectedReport.reviewStatus}</p>
              <h3 id="selected-report-title">{selectedReport.title}</h3>
              <dl className="ki-definition-grid">
                <div><dt>Organisation</dt><dd>{selectedReport.organisation}</dd></div>
                <div><dt>Programme</dt><dd>{selectedReport.programme}</dd></div>
                <div><dt>Project</dt><dd>{selectedReport.project}</dd></div>
                <div><dt>Period</dt><dd>{selectedReport.reportingPeriod}</dd></div>
              </dl>
              <h4>AI-assisted synthesis</h4>
              <p>{selectedReport.summary}</p>
              <h4>Extracted evidence</h4>
              {selectedEvidence.length ? <EvidenceList ids={selectedEvidence.map((item) => item.id)} /> : <p>No extracted evidence is included for this demonstration report.</p>}
            </article>
          </div>
        </section>
      ) : null}

      {activeView === 'portfolio' ? (
        <section className="ki-section" aria-labelledby="portfolio-heading">
          <div className="ki-section-heading">
            <div>
              <p className="eyebrow">Cross-project intelligence</p>
              <h2 id="portfolio-heading">Portfolio intelligence</h2>
            </div>
          </div>

          <div className="ki-insight-grid">
            {insights.map((insight) => (
              <article className="ki-panel" key={insight.id}>
                <EvidenceBadge value={insight.evidenceClass} />
                <h3>{insight.title}</h3>
                <p>{insight.summary}</p>
                {insight.caveat ? <p className="ki-caveat"><strong>Evidence note:</strong> {insight.caveat}</p> : null}
                <EvidenceList ids={insight.evidenceIds} />
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {activeView === 'learning' ? (
        <section className="ki-section" aria-labelledby="learning-heading">
          <div className="ki-section-heading">
            <div>
              <p className="eyebrow">Institutional learning</p>
              <h2 id="learning-heading">Learning library</h2>
            </div>
          </div>
          <p className="ki-lead">Evidence-backed learning notes can be reused across programme design, management review and reporting without becoming detached from their sources.</p>
          <div className="ki-insight-grid">
            {learningNotes.map((note) => (
              <article className="ki-panel" key={note.id}>
                <p className="eyebrow">{note.theme} · {note.status}</p>
                <h3>{note.title}</h3>
                <p>{note.learning}</p>
                <p><strong>Recommended use:</strong> {note.recommendedUse}</p>
                <h4>Supporting evidence</h4>
                <EvidenceList ids={note.evidenceIds} />
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {activeView === 'comparison' ? (
        <section className="ki-section" aria-labelledby="comparison-heading">
          <div className="ki-section-heading">
            <div>
              <p className="eyebrow">Change over time</p>
              <h2 id="comparison-heading">Period comparison</h2>
            </div>
          </div>
          {periodComparisons.map((comparison) => (
            <article className="ki-panel ki-answer" key={comparison.id}>
              <p className="eyebrow">{comparison.project} · {comparison.periods.join(' → ')}</p>
              <h3>{comparison.headline}</h3>
              <p>{comparison.comparison}</p>
              <p className="ki-caveat"><strong>Interpretation limit:</strong> {comparison.caveat}</p>
              <h4>Supporting evidence</h4>
              <EvidenceList ids={comparison.evidenceIds} />
            </article>
          ))}
        </section>
      ) : null}

      {activeView === 'management' ? (
        <section className="ki-section" aria-labelledby="management-heading">
          <div className="ki-section-heading">
            <div>
              <p className="eyebrow">Questions management can actually use</p>
              <h2 id="management-heading">Management intelligence</h2>
            </div>
          </div>
          <div className="ki-insight-grid">
            {managementQuestions.map((item) => (
              <article className="ki-panel" key={item.id}>
                <EvidenceBadge value={item.evidenceClass} />
                <h3>{item.question}</h3>
                <p>{item.answer}</p>
                <p><strong>Decision use:</strong> {item.decisionUse}</p>
                <h4>Supporting evidence</h4>
                <EvidenceList ids={item.evidenceIds} />
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {activeView === 'explorer' ? (
        <section className="ki-section" aria-labelledby="explorer-heading">
          <div className="ki-section-heading">
            <div>
              <p className="eyebrow">Searchable institutional knowledge</p>
              <h2 id="explorer-heading">Knowledge explorer</h2>
            </div>
          </div>

          <div className="form-field ki-question-field">
            <label htmlFor="knowledge-question">Ask a management question of the demonstration evidence</label>
            <input
              id="knowledge-question"
              value={explorerQuestion}
              onChange={(event) => setExplorerQuestion(event.target.value)}
            />
            <p className="field-help">Try questions containing “ROI”, “STEM”, “capacity”, “contradict”, or other wording for the recurring challenge example.</p>
          </div>

          <article className="ki-panel ki-answer" aria-live="polite">
            <p className="eyebrow">Demonstration answer</p>
            <EvidenceBadge value={explorerAnswer.evidenceClass} />
            <h3>{explorerAnswer.title}</h3>
            <p>{explorerAnswer.summary}</p>
            {explorerAnswer.caveat ? <p className="ki-caveat"><strong>Evidence note:</strong> {explorerAnswer.caveat}</p> : null}
            <h4>Supporting evidence</h4>
            <EvidenceList ids={explorerAnswer.evidenceIds} />
          </article>
        </section>
      ) : null}

      {activeView === 'provenance' ? (
        <section className="ki-section" aria-labelledby="provenance-heading">
          <div className="ki-section-heading">
            <div>
              <p className="eyebrow">Evidence → intelligence → provenance</p>
              <h2 id="provenance-heading">Evidence traceability</h2>
            </div>
          </div>
          <p className="ki-lead">Generated insights remain visibly separate from the source evidence used to support them.</p>

          {insights.map((insight) => (
            <article className="ki-provenance-chain" key={insight.id}>
              <div>
                <span className="ki-chain-label">Insight</span>
                <strong>{insight.title}</strong>
                <EvidenceBadge value={insight.evidenceClass} />
              </div>
              <div aria-hidden="true" className="ki-chain-arrow">↓</div>
              <div>
                <span className="ki-chain-label">Supporting evidence</span>
                <EvidenceList ids={insight.evidenceIds} />
              </div>
            </article>
          ))}
        </section>
      ) : null}

      <aside className="status-message" aria-label="Demonstration boundaries">
        <strong>Deliberate boundary:</strong> this build does not replace existing systems, make funding decisions, score grantees, infer causality, or manufacture impact or ROI claims from incomplete evidence.
      </aside>
    </div>
  );
}
