from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected 1 match, found {count}")
    return text.replace(old, new, 1)


# Homepage: keep BiasLens visible as a completed product, but make the controlled-access model explicit.
index_path = Path("index.html")
index_html = index_path.read_text(encoding="utf-8")
index_html = replace_once(
    index_html,
    '<span class="product-badge badge-live">Available Now</span>\n              <div style="margin-top:.75rem"><a class="service-link" href="products.html" aria-label="Explore BiasLens assessment and licensing options">Explore BiasLens <span aria-hidden="true">→</span></a></div>',
    '<span class="product-badge badge-live">Available Now · Invitation Only</span>\n              <div style="margin-top:.75rem"><a class="service-link" href="mailto:hello@beaccessible.co.za?subject=BiasLens%20request%20for%20consideration" aria-label="Request consideration for BiasLens access">Request Consideration <span aria-hidden="true">→</span></a></div>',
    "homepage BiasLens invitation-only positioning",
)
index_path.write_text(index_html, encoding="utf-8")

# Product catalogue: remove the legacy demo route and present BiasLens as controlled-access production software.
products_path = Path("products.html")
products_html = products_path.read_text(encoding="utf-8")
products_html = replace_once(
    products_html,
    '<article class="card"><span class="status">Available now</span><h3>BiasLens™ Full Platform</h3><p>Algorithmic bias assessment and accountability platform for organisations using AI-supported decision systems.</p><p class="meta">Commercial pathway: Request Assessment · Organisation Licence · Enterprise Engagement</p><div class="card-actions"><a class="btn" href="https://6a3ff1475bb402c055e19f25--profound-pony-32a52e.netlify.app/biaslens.html">View Demo</a><a class="text-link" href="mailto:hello@beaccessible.co.za?subject=BiasLens%20assessment%20request">Request Assessment</a></div></article>',
    '<article class="card"><span class="status">Available now · Invitation only</span><h3>BiasLens™ Full Platform</h3><p>Production-ready algorithmic bias assessment and accountability platform for organisations using AI-supported decision systems.</p><p class="meta">Access model: invitation only · selected organisational assessments · organisation licences · enterprise engagements</p><div class="card-actions"><a class="btn" href="mailto:hello@beaccessible.co.za?subject=BiasLens%20request%20for%20consideration">Request Consideration</a><a class="text-link" href="https://biaslens.beaccessible.co.za">Learn About BiasLens</a></div></article>',
    "catalogue BiasLens invitation-only positioning",
)
products_path.write_text(products_html, encoding="utf-8")

for path, text in ((index_path, index_html), (products_path, products_html)):
    if "BiasLens" in text and "View Demo" in text and path == products_path:
        raise RuntimeError("Legacy BiasLens demo CTA is still present in products.html")

print("BiasLens invitation-only positioning applied successfully.")
