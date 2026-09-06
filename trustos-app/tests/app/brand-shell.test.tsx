import { within } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, test } from 'vitest';
import RootLayout from '@/app/layout';

test('provides a main landmark, skip link and TrustOS brand', () => {
  const documentMarkup = renderToStaticMarkup(
    <RootLayout>
      <div>Test</div>
    </RootLayout>,
  );

  const documentContainer = document.createElement('div');
  documentContainer.innerHTML = documentMarkup;
  document.body.append(documentContainer);
  const screen = within(documentContainer);

  try {
    expect(screen.getByText('Skip to main content')).toHaveAttribute('href', '#main-content');
    expect(screen.getByText('TrustOS')).toBeInTheDocument();
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id', 'main-content');
    expect(main).toHaveTextContent('Test');
  } finally {
    documentContainer.remove();
  }
});