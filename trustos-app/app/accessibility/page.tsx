export default function AccessibilityPage() {
  return (
    <article className="account-card" aria-labelledby="accessibility-heading">
      <h1 id="accessibility-heading">TrustOS Accessibility</h1>
      <p>
        TrustOS is being designed and tested against WCAG 2.2 Level AA requirements for the Phase 2
        controlled pilot. BeAccessible is not claiming formal conformance until the remaining
        deployed browser and assistive-technology release checks are complete.
      </p>

      <h2>Accessibility features in the current build</h2>
      <ul>
        <li>Keyboard operation and strong visible focus indicators for interactive controls.</li>
        <li>Semantic headings, labels, tables and status or error messages for screen-reader use.</li>
        <li>Error summaries that receive focus when an account action returns an error.</li>
        <li>Responsive layouts intended to support narrow viewports, browser zoom and reflow.</li>
        <li>Reduced-motion support based on the user&apos;s operating-system preference.</li>
        <li>Plain-language account, invitation, access-denial and recovery messages.</li>
        <li>Non-colour-only status and outcome information in administrative and audit views.</li>
      </ul>

      <h2>Testing status</h2>
      <p>
        Automated TrustOS application tests, production-build checks and Chromium legacy/browser
        regressions have passed on the Phase 2 branch. Automated checks are not treated as
        sufficient evidence on their own.
      </p>
      <p>
        Full deployed Playwright verification in both Chromium and Firefox, 320 CSS pixel and 400%
        equivalent reflow checks, forced-colour verification, and NVDA testing with Firefox and
        Chromium remain release gates. These checks are recorded as pending until they are run on
        the protected staging environment; they are not being represented as completed.
      </p>

      <h2>Known limitations</h2>
      <p>
        The final deployed assistive-technology verification has not yet been completed. TrustOps
        and GrantFlow also include preserved legacy module content, so any remaining module-level
        accessibility limitations must be recorded separately rather than hidden by the TrustOS
        shell assessment.
      </p>

      <h2>Report an accessibility barrier</h2>
      <p>
        If a TrustOS task is difficult or impossible to complete, contact BeAccessible at{' '}
        <a href="mailto:hello@beaccessible.co.za">hello@beaccessible.co.za</a> and describe the
        task, page and assistive technology or access method you were using, where relevant. Do not
        include passwords, authentication tokens or recovery links.
      </p>

      <p>
        This accessibility statement applies to the TrustOS Phase 2 pilot and will be updated as
        deployed accessibility evidence is completed.
      </p>
    </article>
  );
}
