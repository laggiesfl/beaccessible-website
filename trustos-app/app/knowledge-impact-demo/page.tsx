import type { Metadata } from 'next';

import { KnowledgeImpactDemoRelease } from '@/components/knowledge-impact-demo-release';

export const metadata: Metadata = {
  title: 'Knowledge & Impact Intelligence Demonstration',
  description: 'A synthetic-data demonstration of traceable programme and grantee reporting intelligence within BeAccessible TrustOS / GrantFlow.',
};

export default function KnowledgeImpactDemoPage() {
  return (
    <div className="page-content">
      <KnowledgeImpactDemoRelease />
    </div>
  );
}
