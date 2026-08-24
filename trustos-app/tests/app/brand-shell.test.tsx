import { within } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import RootLayout from '@/app/layout';

test('provides a named main region and TrustOS brand', () => {
  const documentMarkup = renderToStaticMarkup(
    <RootLayout>
      <main aria-label="TrustOS content">Test</main>
    </RootLayout>,
  );

  const documentContainer = document.createElement('div');
  documentContainer.innerHTML = documentMarkup;
  document.body.append(documentContainer);
  const screen = within(documentContainer);

  try {
    expect(screen.getByText('Skip to main content')).toHaveAttribute('href', '#main-content');
    expect(screen.getByText('TrustOS')).toBeInTheDocument();
    expect(screen.getByLabelText('TrustOS content')).toBeInTheDocument();
  } finally {
    documentContainer.remove();
  }
});
