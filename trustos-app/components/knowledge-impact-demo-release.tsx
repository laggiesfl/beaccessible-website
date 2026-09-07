'use client';

import { useEffect, useRef, useState } from 'react';

import { KnowledgeImpactDemo } from '@/components/knowledge-impact-demo';

type ReadingState = 'idle' | 'reading' | 'paused';

export function KnowledgeImpactDemoRelease() {
  const demoRef = useRef<HTMLDivElement>(null);
  const originalRootFontSize = useRef<string | null>(null);
  const baseRootFontSize = useRef<number | null>(null);
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [textSize, setTextSize] = useState(100);
  const [readingState, setReadingState] = useState<ReadingState>('idle');
  const [readingStatus, setReadingStatus] = useState('Reading is off.');

  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (originalRootFontSize.current === null) {
      originalRootFontSize.current = document.documentElement.style.fontSize;
      baseRootFontSize.current = Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize) || 16;
    }

    const base = baseRootFontSize.current ?? 16;
    document.documentElement.style.fontSize = `${base * (textSize / 100)}px`;

    return () => {
      document.documentElement.style.fontSize = originalRootFontSize.current ?? '';
    };
  }, [textSize]);

  useEffect(() => () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const speechSupported = () =>
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window;

  const readThisPage = () => {
    if (!speechSupported()) {
      setReadingStatus('Read this page is not supported in this browser.');
      return;
    }

    const text = demoRef.current?.innerText.replace(/\s+/g, ' ').trim();
    if (!text) {
      setReadingStatus('There is no readable demonstration content available.');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => {
      setReadingState('reading');
      setReadingStatus('Reading this page.');
    };
    utterance.onend = () => {
      setReadingState('idle');
      setReadingStatus('Finished reading.');
    };
    utterance.onerror = () => {
      setReadingState('idle');
      setReadingStatus('Reading could not be completed.');
    };
    window.speechSynthesis.speak(utterance);
  };

  const pauseOrResumeReading = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setReadingStatus('Pause reading is not supported in this browser.');
      return;
    }

    if (window.speechSynthesis.paused || readingState === 'paused') {
      window.speechSynthesis.resume();
      setReadingState('reading');
      setReadingStatus('Reading resumed from the paused position.');
      return;
    }

    if (window.speechSynthesis.speaking || readingState === 'reading') {
      window.speechSynthesis.pause();
      setReadingState('paused');
      setReadingStatus('Reading paused. Use Resume reading to continue from this position.');
      return;
    }

    setReadingStatus('Start reading first, then use Pause reading.');
  };

  const stopReading = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setReadingState('idle');
    setReadingStatus('Reading stopped.');
  };

  const decreaseText = () => setTextSize((value) => Math.max(90, value - 10));
  const increaseText = () => setTextSize((value) => Math.min(150, value + 10));

  const shellClassName = `ki-release-shell${highContrast ? ' ki-high-contrast' : ''}${reducedMotion ? ' ki-reduced-motion' : ''}`;

  return (
    <div className={shellClassName}>
      <section className="ki-release-toolbar" aria-label="Accessibility tools">
        <strong>Accessibility tools</strong>
        <div className="ki-release-actions" aria-label="Reading and display controls">
          <button type="button" className="ki-preference-button" onClick={readThisPage}>
            Read this page
          </button>
          <button
            type="button"
            className="ki-preference-button"
            aria-pressed={readingState === 'paused'}
            onClick={pauseOrResumeReading}
          >
            {readingState === 'paused' ? 'Resume reading' : 'Pause reading'}
          </button>
          <button type="button" className="ki-preference-button" onClick={stopReading}>
            Stop reading
          </button>
          <button type="button" className="ki-preference-button" onClick={decreaseText} disabled={textSize <= 90}>
            Decrease text
          </button>
          <button type="button" className="ki-preference-button" onClick={increaseText} disabled={textSize >= 150}>
            Increase text
          </button>
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
        <p className="ki-release-status" aria-live="polite">
          {readingStatus} Text size is {textSize}%.
        </p>
      </section>

      <div ref={demoRef} className="ki-release-demo">
        <KnowledgeImpactDemo />
      </div>
    </div>
  );
}
