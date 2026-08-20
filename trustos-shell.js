(function () {
  'use strict';

  const config = window.TRUSTOS_SUITE_CONFIG || {};
  const catalogue = window.TRUSTOS_MODULE_CATALOGUE || [];

  const navigation = document.getElementById('module-buttons');
  const unavailableList = document.getElementById('unavailable-modules');
  const unavailableRegion = document.getElementById('unavailable-region');
  const emptyState = document.getElementById('empty-state');
  const configurationError = document.getElementById('configuration-error');
  const workspace = document.getElementById('module-workspace');
  const framesContainer = document.getElementById('module-frames');
  const moduleTitle = document.getElementById('module-title');
  const moduleDescription = document.getElementById('module-description');
  const standaloneLink = document.getElementById('standalone-link');
  const statusRegion = document.getElementById('suite-status');
  const licensedFor = document.getElementById('licensed-for');

  function failClosed() {
    workspace.hidden = true;
    emptyState.hidden = true;
    configurationError.hidden = false;
    licensedFor.textContent = 'Configuration unavailable';
    statusRegion.textContent = 'Module configuration error. No demonstration module was loaded.';
  }

  const core = window.TrustOSCore;
  if (!core || typeof core.validateModuleCatalogue !== 'function') {
    failClosed();
    return;
  }

  const validation = core.validateModuleCatalogue(catalogue);
  if (!validation.isValid) {
    failClosed();
    return;
  }

  const validCatalogue = validation.modules;
  const enabledModules = core.resolveEnabledModules(validCatalogue, config.licensedModuleIds);
  const framesByModuleId = new Map();

  configurationError.hidden = true;
  licensedFor.textContent = config.organisationName || 'BeAccessible demonstration';

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
    framesByModuleId.forEach((moduleFrame, candidateId) => {
      moduleFrame.hidden = candidateId !== moduleId;
    });
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

    const moduleFrame = document.createElement('iframe');
    moduleFrame.dataset.moduleId = moduleDefinition.id;
    moduleFrame.title = moduleDefinition.frameTitle;
    moduleFrame.src = moduleDefinition.embeddedSource || moduleDefinition.source;
    moduleFrame.loading = framesByModuleId.size === 0 ? 'eager' : 'lazy';
    moduleFrame.hidden = true;
    moduleFrame.setAttribute('sandbox', 'allow-popups allow-scripts');
    framesByModuleId.set(moduleDefinition.id, moduleFrame);
    framesContainer.appendChild(moduleFrame);
  });

  const enabledIds = new Set(enabledModules.map((moduleDefinition) => moduleDefinition.id));
  const unavailableModules = validCatalogue.filter((moduleDefinition) => !enabledIds.has(moduleDefinition.id));

  unavailableModules.forEach((moduleDefinition) => {
    const item = document.createElement('li');
    appendModuleLabel(item, moduleDefinition, 'Not selected in this demonstration configuration.');
    unavailableList.appendChild(item);
  });
  unavailableRegion.hidden = unavailableModules.length === 0;

  if (enabledModules.length === 0) {
    workspace.hidden = true;
    emptyState.hidden = false;
    statusRegion.textContent = 'No TrustOS modules are enabled in this demonstration configuration.';
    return;
  }

  const requestedId = window.TrustOSCore.resolveInitialModuleId(
    enabledModules,
    config.requestedModuleId
  );
  workspace.hidden = false;
  activateModule(requestedId, false);
})();
