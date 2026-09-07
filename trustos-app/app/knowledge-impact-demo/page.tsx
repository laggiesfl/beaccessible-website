import type { Metadata } from 'next';

import { KnowledgeImpactDemo } from '@/components/knowledge-impact-demo';

export const metadata: Metadata = {
  title: 'Knowledge & Impact Intelligence Demonstration',
  description: 'A synthetic-data demonstration of traceable programme and grantee reporting intelligence within BeAccessible TrustOS / GrantFlow.',
};

export default function KnowledgeImpactDemoPage() {
  return (
    <main id="main-content" className="page-content">
      <KnowledgeImpactDemo />
    </main>
  );
}
