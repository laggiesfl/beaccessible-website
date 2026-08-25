export default function AccessibilityPage() {
  return (
    <article className="account-card" aria-labelledby="accessibility-heading">
      <h1 id="accessibility-heading">TrustOS Accessibility</h1>
      <p>
        TrustOS is being designed and tested to support WCAG 2.2 AA accessibility requirements
        during the Phase 2 controlled pilot.
      </p>

      <h2>Current accessibility approach</h2>
      <ul>
        <li>Keyboard access and visible focus indicators for interactive controls.</li>
        <li>Semantic headings, labels and status messages for screen-reader use.</li>
        <li>Responsive layouts that support browser zoom and reflow.</li>
        <li>Reduced-motion support based on the user&apos;s operating-system preference.</li>
        <li>Plain-language account, invitation and error messages.</li>
      </ul>

      <h2>Pilot testing</h2>
      <p>
        Automated checks alone are not treated as sufficient. Manual keyboard, screen-reader,
        zoom/reflow and user testing remain release gates before broader production use.
      </p>

      <h2>Report an accessibility barrier</h2>
      <p>
        If a TrustOS task is difficult or impossible to complete, contact BeAccessible at{' '}
        <a href="mailto:hello@beaccessible.co.za">hello@beaccessible.co.za</a> and describe the
        task, page and assistive technology or access method you were using, where relevant.
      </p>

      <p>
        This accessibility statement applies to the TrustOS Phase 2 pilot and will be updated as
        testing and operational modules are completed.
      </p>
    </article>
  );
}
