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

  function validateModuleCatalogue(catalogue) {
    const requiredTextFields = [
      'id', 'name', 'shortName', 'description', 'source', 'frameTitle'
    ];
    const seenIds = new Set();
    const modules = [];
    let invalidCount = 0;

    (Array.isArray(catalogue) ? catalogue : []).forEach((moduleDefinition) => {
      const hasRequiredText = moduleDefinition && requiredTextFields.every((field) =>
        typeof moduleDefinition[field] === 'string' && moduleDefinition[field].trim()
      );
      const hasValidEmbeddedSource = !moduleDefinition ||
        moduleDefinition.embeddedSource === undefined ||
        (typeof moduleDefinition.embeddedSource === 'string' && moduleDefinition.embeddedSource.trim());
      const isUnique = hasRequiredText && !seenIds.has(moduleDefinition.id);

      if (!hasRequiredText || !hasValidEmbeddedSource || !isUnique) {
        invalidCount += 1;
        return;
      }

      seenIds.add(moduleDefinition.id);
      modules.push(moduleDefinition);
    });

    return {
      isValid: Array.isArray(catalogue) && invalidCount === 0,
      modules,
      invalidCount
    };
  }

  return { resolveEnabledModules, resolveInitialModuleId, validateModuleCatalogue };
});
