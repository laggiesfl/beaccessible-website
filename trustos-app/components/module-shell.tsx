'use client';

import { useMemo, useState } from 'react';

import type { TrustOSModuleId } from '@/lib/modules/access';

export type ModuleShellItem = {
  id: TrustOSModuleId;
  name: string;
};

export function ModuleShell({ modules, initialModule }: { modules: readonly ModuleShellItem[]; initialModule?: TrustOSModuleId }) {
  const firstModule = modules[0]?.id;
  const startingModule = initialModule && modules.some((module) => module.id === initialModule)
    ? initialModule
    : firstModule;
  const [selectedModule, setSelectedModule] = useState<TrustOSModuleId | undefined>(startingModule);
  const selectedName = useMemo(
    () => modules.find((module) => module.id === selectedModule)?.name ?? 'No module',
    [modules, selectedModule],
  );

  if (!firstModule || !selectedModule) {
    return <p className="status-message">No TrustOS modules are available for your current role.</p>;
  }

  return (
    <section className="module-shell" aria-labelledby="module-shell-heading">
      <div className="module-shell-heading-row">
        <div>
          <p className="eyebrow">Licensed workspace</p>
          <h2 id="module-shell-heading">TrustOS modules</h2>
        </div>
        <a className="module-skip-link" href={`#${selectedModule}-module-frame`}>Skip to selected module</a>
      </div>

      <div className="module-switcher" role="group" aria-label="Choose a TrustOS module">
        {modules.map((module) => (
          <button
            key={module.id}
            type="button"
            className="module-switcher-button"
            aria-pressed={selectedModule === module.id}
            onClick={() => setSelectedModule(module.id)}
          >
            {module.name}
          </button>
        ))}
      </div>

      <p className="module-selection-status" role="status" aria-live="polite">
        {selectedName} selected.
      </p>

      <div className="module-frame-stack">
        {modules.map((module) => (
          <iframe
            key={module.id}
            id={`${module.id}-module-frame`}
            className="module-frame"
            title={`${module.name} module`}
            src={`/app/modules/${module.id}`}
            sandbox="allow-scripts allow-popups"
            hidden={selectedModule !== module.id}
          />
        ))}
      </div>
    </section>
  );
}
