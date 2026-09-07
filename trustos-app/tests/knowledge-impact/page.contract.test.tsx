import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { KnowledgeImpactDemo } from '@/components/knowledge-impact-demo';

describe('KnowledgeImpactDemo', () => {
  it('discloses synthetic data and demonstration boundaries', () => {
    render(<KnowledgeImpactDemo />);
    expect(screen.getByRole('heading', { level: 1, name: 'Knowledge & Impact Intelligence' })).toBeInTheDocument();
    expect(screen.getByText(/this prototype uses synthetic data/i)).toBeInTheDocument();
    expect(screen.getByText(/does not represent Zenex Foundation data/i)).toBeInTheDocument();
  });

  it('provides keyboard-operable view navigation', async () => {
    const user = userEvent.setup();
    render(<KnowledgeImpactDemo />);
    const portfolioButton = screen.getByRole('button', { name: 'Portfolio intelligence' });
    portfolioButton.focus();
    await user.keyboard('{Enter}');
    expect(portfolioButton).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { level: 2, name: 'Portfolio intelligence' })).toBeInTheDocument();
  });

  it('shows provenance for an insight and distinguishes evidence classes in text', async () => {
    const user = userEvent.setup();
    render(<KnowledgeImpactDemo />);
    await user.click(screen.getByRole('button', { name: 'Evidence traceability' }));
    expect(screen.getByRole('heading', { level: 2, name: 'Evidence traceability' })).toBeInTheDocument();
    expect(screen.getAllByText('AI interpretation').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Calculated indicator').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Source evidence').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Source location:/i).length).toBeGreaterThan(0);
  });

  it('refuses to manufacture an ROI conclusion', async () => {
    const user = userEvent.setup();
    render(<KnowledgeImpactDemo />);
    await user.click(screen.getByRole('button', { name: 'Knowledge explorer' }));
    const question = screen.getByLabelText(/Ask a management question/i);
    await user.clear(question);
    await user.type(question, 'What is the ROI?');
    expect(screen.getByRole('heading', { level: 3, name: /Evidence is insufficient for a defensible ROI conclusion/i })).toBeInTheDocument();
  });
});
