(function () {
  'use strict';

  const config = window.TRUSTOS_SUITE_CONFIG || {};
  const catalogue = window.TRUSTOS_MODULE_CATALOGUE || [];
  const enabledModules = window.TrustOSCore.resolveEnabledModules(
    catalogue,
    config.licensedModuleIds
  );

  const navigation = document.getElementById('module-buttons');
  const unavailableList = document.getElementById('unavailable-modules');
  const unavailableRegion = document.getElementById('unavailable-region');
  const emptyState = document.getElementById('empty-state');
  const workspace = document.getElementById('module-workspace');
  const frame = document.getElementById('module-frame');
  const moduleTitle = document.getElementById('module-title');
  const moduleDescription = document.getElementById('module-description');
  const standaloneLink = document.getElementById('standalone-link');
  const statusRegion = document.getElementById('suite-status');
  const licensedFor = document.getElementById('licensed-for');

  licensedFor.textContent = config.organisationName || 'Licensed organisation';

  function appendModuleLabel(container, moduleDefinition, secondaryText) {
    const name = document.createElement('strong');
    const detail = document.createElement('span');
    name.textContent = moduleDefinition.name;
    detail.textContent = secondaryText;
    container.appendChild(name);
    container.appendChild(detail);
  }

  function activateModule(moduleId, announce) {
    const moduleDefinition = enabledModules.find((candidate) => candidate.id === moduleId);
    if (!moduleDefinition) return;

    navigation.querySelectorAll('button').forEach((button) => {
      const isActive = button.dataset.moduleId === moduleId;
      button.setAttribute('aria-pressed', String(isActive));
      button.classList.toggle('is-active', isActive);
    });

    moduleTitle.textContent = moduleDefinition.name;
    moduleDescription.textContent = moduleDefinition.description;
    frame.title = moduleDefinition.frameTitle;
    frame.src = moduleDefinition.embeddedSource || moduleDefinition.source;
    standaloneLink.href = moduleDefinition.source;
    standaloneLink.textContent = 'Open ' + moduleDefinition.shortName + ' as a full page';
    document.title = moduleDefinition.name + ' | TrustOS';

    if (announce) {
      statusRegion.textContent = moduleDefinition.name + ' opened.';
    }
  }

  enabledModules.forEach((moduleDefinition) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'module-button';
    button.dataset.moduleId = moduleDefinition.id;
    button.setAttribute('aria-pressed', 'false');
    appendModuleLabel(button, moduleDefinition, moduleDefinition.description);
    button.addEventListener('click', () => activateModule(moduleDefinition.id, true));
    navigation.appendChild(button);
  });

  const enabledIds = new Set(enabledModules.map((moduleDefinition) => moduleDefinition.id));
  const unavailableModules = catalogue.filter((moduleDefinition) => !enabledIds.has(moduleDefinition.id));

  unavailableModules.forEach((moduleDefinition) => {
    const item = document.createElement('li');
    appendModuleLabel(item, moduleDefinition, 'Not included in this licence.');
    unavailableList.appendChild(item);
  });
  unavailableRegion.hidden = unavailableModules.length === 0;

  if (enabledModules.length === 0) {
    workspace.hidden = true;
    emptyState.hidden = false;
    statusRegion.textContent = 'No TrustOS modules are enabled for this licence.';
    return;
  }

  const requestedId = window.TrustOSCore.resolveInitialModuleId(
    enabledModules,
    config.requestedModuleId
  );
  activateModule(requestedId, false);
})();
