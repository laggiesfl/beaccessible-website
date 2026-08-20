(function (root) {
  'use strict';

  root.TRUSTOS_SUITE_CONFIG = root.TRUSTOS_SUITE_CONFIG || {
    organisationName: 'BeAccessible demonstration',
    licensedModuleIds: ['trustops', 'grantflow'],
    requestedModuleId: 'trustops'
  };

  root.TRUSTOS_MODULE_CATALOGUE = [
    {
      id: 'trustops',
      name: 'TrustOps Core',
      shortName: 'TrustOps',
      description: 'Trust-wide operations covering projects, finance, approvals, impact monitoring, and documents.',
      source: 'trustops.html',
      embeddedSource: 'trustops.html?embedded=1',
      frameTitle: 'TrustOps Core demonstration'
    },
    {
      id: 'grantflow',
      name: 'GrantFlow',
      shortName: 'GrantFlow',
      description: 'The grant lifecycle from applicant intake and assessment through contracting, payments, and reporting.',
      source: 'grantflow.html',
      frameTitle: 'GrantFlow demonstration'
    }
  ];
})(typeof globalThis !== 'undefined' ? globalThis : this);
