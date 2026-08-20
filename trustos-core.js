(function (root, factory) {
  const api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  root.TrustOSCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function resolveEnabledModules(catalogue, licensedModuleIds) {
    const allowedIds = new Set(Array.isArray(licensedModuleIds) ? licensedModuleIds : []);
    return (Array.isArray(catalogue) ? catalogue : []).filter((moduleDefinition) =>
      moduleDefinition && allowedIds.has(moduleDefinition.id)
    );
  }

  function resolveInitialModuleId(enabledModules, requestedModuleId) {
    const modules = Array.isArray(enabledModules) ? enabledModules : [];
    const requestedModule = modules.find((moduleDefinition) =>
      moduleDefinition && moduleDefinition.id === requestedModuleId
    );

    if (requestedModule) return requestedModule.id;
    return modules.length && modules[0] ? modules[0].id : null;
  }

  return { resolveEnabledModules, resolveInitialModuleId };
});
