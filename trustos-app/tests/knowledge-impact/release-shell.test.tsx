import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { KnowledgeImpactDemoRelease } from '@/components/knowledge-impact-demo-release';

describe('KnowledgeImpactDemoRelease', () => {
  it('provides the complete accessibility toolbar with reading and text-size controls', () => {
    render(<KnowledgeImpactDemoRelease />);

    expect(screen.getByRole('button', { name: 'Read this page' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pause reading' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Stop reading' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Decrease text' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Increase text' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'High contrast' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Reduced motion' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('changes the text-size preference in bounded steps', () => {
    render(<KnowledgeImpactDemoRelease />);

    expect(screen.getByText(/Text size is 100%/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Increase text' }));
    expect(screen.getByText(/Text size is 110%/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Decrease text' }));
    expect(screen.getByText(/Text size is 100%/i)).toBeInTheDocument();
  });

  it('pauses and resumes an active reading session without restarting it', () => {
    const speech = {
      speaking: true,
      paused: false,
      pause: vi.fn(() => { speech.paused = true; }),
      resume: vi.fn(() => { speech.paused = false; }),
      cancel: vi.fn(),
      speak: vi.fn(),
    };

    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: speech });

    render(<KnowledgeImpactDemoRelease />);
    const pauseButton = screen.getByRole('button', { name: 'Pause reading' });

    fireEvent.click(pauseButton);
    expect(speech.pause).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Resume reading' })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Resume reading' }));
    expect(speech.resume).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Pause reading' })).toHaveAttribute('aria-pressed', 'false');
  });
});
