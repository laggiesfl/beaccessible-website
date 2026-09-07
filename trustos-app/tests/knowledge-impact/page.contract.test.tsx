import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { KnowledgeImpactDemo } from '@/components/knowledge-impact-demo';

describe('KnowledgeImpactDemo', () => {
  it('discloses synthetic data and demonstration boundaries', () => {
    render(<KnowledgeImpactDemo />);
    expect(screen.getByRole('heading', { level: 1, name: 'Knowledge & Impact Intelligence' })).toBeInTheDocument();
    expect(screen.getByText(/this prototype uses synthetic data/i)).toBeInTheDocument();
    expect(screen.getByText(/does not represent Zenex Foundation data/i)).toBeInTheDocument();
  });

  it('embeds the BeAccessible brand logo with meaningful alt text', () => {
    render(<KnowledgeImpactDemo />);
    expect(screen.getByRole('img', {
      name: 'BeAccessible logo — circular badge with wheelchair user, pram, shopping trolley, and accessibility ramp icons, text reads BEACCESSIBLE CREATING ACCESS FOR ALL',
    })).toHaveAttribute('src', '/beaccessible-logo.svg');
  });

  it('keeps the primary demonstration navigation to eight accessible views', () => {
    render(<KnowledgeImpactDemo />);
    const navigation = screen.getByRole('navigation', { name: 'Knowledge and impact demonstration views' });
    expect(navigation.querySelectorAll('button')).toHaveLength(8);
  });

  it('uses native keyboard-focusable buttons for view navigation', () => {
    render(<KnowledgeImpactDemo />);
    const portfolioButton = screen.getByRole('button', { name: 'Portfolio intelligence' });
    expect(portfolioButton.tagName).toBe('BUTTON');
    portfolioButton.focus();
    expect(portfolioButton).toHaveFocus();
    fireEvent.click(portfolioButton);
    expect(portfolioButton).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { level: 2, name: 'Portfolio intelligence' })).toBeInTheDocument();
  });

  it('shows provenance for an insight and distinguishes evidence classes in text', () => {
    render(<KnowledgeImpactDemo />);
    fireEvent.click(screen.getByRole('button', { name: 'Evidence traceability' }));
    expect(screen.getByRole('heading', { level: 2, name: 'Evidence traceability' })).toBeInTheDocument();
    expect(screen.getAllByText('AI interpretation').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Calculated indicator').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Source evidence').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Source location:/i).length).toBeGreaterThan(0);
  });

  it('refuses to manufacture an ROI conclusion', () => {
    render(<KnowledgeImpactDemo />);
    fireEvent.click(screen.getByRole('button', { name: 'Knowledge explorer' }));
    const question = screen.getByLabelText(/Ask a management question/i);
    fireEvent.change(question, { target: { value: 'What is the ROI?' } });
    expect(screen.getByRole('heading', { level: 3, name: /Evidence is insufficient for a defensible ROI conclusion/i })).toBeInTheDocument();
  });

  it('provides a learning library with evidence-backed organisational learning', () => {
    render(<KnowledgeImpactDemo />);
    fireEvent.click(screen.getByRole('button', { name: 'Learning library' }));
    expect(screen.getByRole('heading', { level: 2, name: 'Learning library' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /Implementation conditions need explicit attention/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Supporting evidence/i).length).toBeGreaterThan(0);
  });

  it('compares reporting periods while preserving the non-causal caveat', () => {
    render(<KnowledgeImpactDemo />);
    fireEvent.click(screen.getByRole('button', { name: 'Period comparison' }));
    expect(screen.getByRole('heading', { level: 2, name: 'Period comparison' })).toBeInTheDocument();
    expect(screen.getByText(/68% in 2025 to 82% in Jan–Jun 2026/i)).toBeInTheDocument();
    expect(screen.getByText(/descriptive, not proof/i)).toBeInTheDocument();
  });

  it('shows management intelligence including evidence that needs reconciliation', () => {
    render(<KnowledgeImpactDemo />);
    fireEvent.click(screen.getByRole('button', { name: 'Management intelligence' }));
    expect(screen.getByRole('heading', { level: 2, name: 'Management intelligence' })).toBeInTheDocument();
    expect(screen.getByText(/needs reconciliation rather than automatic summarisation/i)).toBeInTheDocument();
    expect(screen.getByText(/should be reviewed, not silently resolved by AI/i)).toBeInTheDocument();
  });
});
