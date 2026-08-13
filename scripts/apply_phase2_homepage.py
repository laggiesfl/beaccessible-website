from pathlib import Path

INDEX = Path("index.html")
html = INDEX.read_text(encoding="utf-8")


def replace_once(old: str, new: str, label: str) -> None:
    global html
    count = html.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected 1 match, found {count}")
    html = html.replace(old, new, 1)


replace_once(
    "Tools your own team runs — every BeAccessible platform is built so the capability stays inside your organisation, not with us. All products are demo-ready — explore them live.",
    "Accessible digital tools, assessments and platforms that help organisations build inclusion capability internally. Explore products available now, selected pilots and specialist solutions.",
    "products introduction",
)

product_updates = [
    (
        '<h3 id="product-1-heading">BiasLens™</h3>\n              <p>Algorithmic bias testing and accountability platform. SA AI Policy, EU AI Act, and IBM bias taxonomy aligned.</p>\n              <span class="product-badge badge-live">Live Demo</span>',
        '<h3 id="product-1-heading">BiasLens™</h3>\n              <p>Algorithmic bias testing and accountability platform. SA AI Policy, EU AI Act, and IBM bias taxonomy aligned.</p>\n              <span class="product-badge badge-live">Available Now</span>\n              <div style="margin-top:.75rem"><a class="service-link" href="products.html" aria-label="Explore BiasLens assessment and licensing options">Explore BiasLens <span aria-hidden="true">→</span></a></div>',
        "BiasLens card",
    ),
    (
        '<h3 id="product-2-heading">GrantFlow AI™</h3>\n              <p>End-to-end automated grant management with AI scoring, adjudication, and M&amp;E dashboards for CSI divisions.</p>\n              <span class="product-badge badge-live">Live Demo</span>',
        '<h3 id="product-2-heading">GrantFlow AI™</h3>\n              <p>End-to-end automated grant management with AI scoring, adjudication, and M&amp;E dashboards for CSI divisions.</p>\n              <span class="product-badge badge-coming">Demonstration</span>\n              <div style="margin-top:.75rem"><a class="service-link" href="grantflow.html" aria-label="Explore the GrantFlow AI demonstration">Explore Demonstration <span aria-hidden="true">→</span></a></div>',
        "GrantFlow card",
    ),
    (
        '<h3 id="product-3-heading">HR Policy Compliance Auditor</h3>\n              <p>AI-powered audit of HR policies against South African labour legislation. Free audit, premium rewrite available.</p>\n              <span class="product-badge badge-live">Live Demo</span>',
        '<h3 id="product-3-heading">HR Policy Compliance Auditor</h3>\n              <p>AI-powered audit of HR policies against South African labour legislation. Free audit, premium rewrite available.</p>\n              <span class="product-badge badge-live">Available Now</span>\n              <div style="margin-top:.75rem"><a class="service-link" href="beaccessible-hr-policy-compliance-auditor-v6.html" aria-label="Start the HR Policy Compliance Auditor">Start Audit <span aria-hidden="true">→</span></a></div>',
        "HR auditor card",
    ),
    (
        '<h3 id="product-4-heading">TrustOps</h3>\n              <p>ERP system for development trusts — Finance, Projects, and M&amp;E. Lite and Enterprise tiers available.</p>\n              <span class="product-badge badge-live">Live Demo</span>',
        '<h3 id="product-4-heading">TrustOps</h3>\n              <p>ERP system for development trusts — Finance, Projects, and M&amp;E. Lite and Enterprise tiers available.</p>\n              <span class="product-badge badge-coming">Demonstration</span>\n              <div style="margin-top:.75rem"><a class="service-link" href="products.html" aria-label="View TrustOps and other BeAccessible product options">View Product Catalogue <span aria-hidden="true">→</span></a></div>',
        "TrustOps card",
    ),
    (
        '<h3 id="product-5-heading">InclusiveLearn™ UDL Platform</h3>\n              <p>Universal Design for Learning platform — review, redesign, and report on inclusive learning experiences.</p>\n              <span class="product-badge badge-live">Live Demo</span>',
        '<h3 id="product-5-heading">InclusiveLearn™ UDL Platform</h3>\n              <p>Universal Design for Learning platform — review, redesign, and report on inclusive learning experiences.</p>\n              <span class="product-badge badge-coming">Demonstration</span>\n              <div style="margin-top:.75rem"><a class="service-link" href="inclusivelearn-udl.html" aria-label="Explore the InclusiveLearn UDL demonstration">Explore Demonstration <span aria-hidden="true">→</span></a></div>',
        "InclusiveLearn card",
    ),
    (
        '<h3 id="product-6-heading">CyberResilience OS™</h3>\n              <p>Cyber resilience operating model with disability-inclusive incident response aligned to UNCRPD Article 11.</p>\n              <span class="product-badge badge-live">Live Demo</span>',
        '<h3 id="product-6-heading">CyberResilience OS™</h3>\n              <p>Cyber resilience operating model with disability-inclusive incident response aligned to UNCRPD Article 11.</p>\n              <span class="product-badge badge-coming">Demonstration</span>\n              <div style="margin-top:.75rem"><a class="service-link" href="cyberresilience.html" aria-label="Explore the CyberResilience OS demonstration">Explore Demonstration <span aria-hidden="true">→</span></a></div>',
        "CyberResilience card",
    ),
]

for old, new, label in product_updates:
    replace_once(old, new, label)

replace_once(
    'aria-label="View all 12 BeAccessible digital products with live demos"',
    'aria-label="Explore BeAccessible products and platforms by availability and access model"',
    "catalogue aria label",
)
replace_once(
    'View All 12 Products &amp; Live Demos',
    'Explore Products &amp; Platforms',
    "catalogue button text",
)
replace_once(
    'Including BiasMap, GlowGo, Digital Learner Logbooks, Accommodation Cost Calculator, Donor Concept Note Assistant &amp; more',
    'Browse products available now, selected pilots, specialist assessments and demonstrations.',
    "catalogue supporting text",
)

replace_once(
    '<li><a href="#contact">Contact</a></li>\n            <li><a href="mailto:hello@beaccessible.co.za">hello@beaccessible.co.za</a></li>',
    '<li><a href="#contact">Contact</a></li>\n            <li><a href="terms.html">Terms &amp; Conditions</a></li>\n            <li><a href="refund-cancellation-delivery.html">Refund, Cancellation &amp; Delivery</a></li>\n            <li><a href="privacy.html">Privacy Policy</a></li>\n            <li><a href="accessibility.html">Accessibility Statement</a></li>\n            <li><a href="mailto:hello@beaccessible.co.za">hello@beaccessible.co.za</a></li>',
    "footer legal links",
)

for forbidden in ("Payfast", "Buy Now", "checkout"):
    if forbidden.lower() in html.lower():
        raise RuntimeError(f"Unexpected payment language introduced: {forbidden}")

required = (
    'href="products.html"',
    'href="terms.html"',
    'href="refund-cancellation-delivery.html"',
    'href="privacy.html"',
    'href="accessibility.html"',
    '>Available Now<',
    '>Demonstration<',
)
for item in required:
    if item not in html:
        raise RuntimeError(f"Required Phase 2 homepage marker missing: {item}")

INDEX.write_text(html, encoding="utf-8")
print("Phase 2 homepage transformation applied successfully.")
