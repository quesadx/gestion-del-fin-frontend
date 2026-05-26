export const Perm = {
  // Dashboard
  METRICS_DASHBOARD: 'metrics.dashboard',

  // People
  PEOPLE_READ: 'people.read',
  PEOPLE_CREATE: 'people.create',
  PEOPLE_UPDATE: 'people.update',
  PEOPLE_DELETE: 'people.delete',
  PEOPLE_STATUS_LOG_CREATE: 'people.status_log.create',
  PEOPLE_PROFESSION_REASSIGN_CREATE: 'people.profession_reassign.create',
  PEOPLE_CONTRIBUTION_OVERRIDE_CREATE: 'people.contribution_override.create',

  // Inventory
  INVENTORY_READ: 'inventory.read',
  INVENTORY_ADJUST: 'inventory.adjust',
  INVENTORY_AUDIT_READ: 'inventory.audit.read',

  // Admission
  ADMISSION_READ: 'admission.read',
  ADMISSION_CREATE: 'admission.create',
  ADMISSION_REVIEW: 'admission.review',

  // Expeditions
  EXPEDITIONS_READ: 'expeditions.read',
  EXPEDITIONS_CREATE: 'expeditions.create',
  EXPEDITIONS_UPDATE: 'expeditions.update',
  EXPEDITIONS_UPDATE_STATUS: 'expeditions.update_status',
  EXPEDITIONS_DELETE: 'expeditions.delete',

  // Transfers
  TRANSFERS_READ: 'transfers.read',
  TRANSFERS_CREATE: 'transfers.create',
  TRANSFERS_APPROVE_SOURCE: 'transfers.approve_source',
  TRANSFERS_APPROVE_TARGET: 'transfers.approve_target',
  TRANSFERS_COMPLETE: 'transfers.complete',
  TRANSFERS_REJECT: 'transfers.reject',
  TRANSFERS_SCHEDULE: 'transfers.schedule',

  // Camps
  CAMPS_READ: 'camps.read',
  CAMPS_CREATE: 'camps.create',
  CAMPS_UPDATE: 'camps.update',
  CAMPS_DELETE: 'camps.delete',

  // Resources
  RESOURCES_READ: 'resources.read',
  RESOURCES_CREATE: 'resources.create',
  RESOURCES_UPDATE: 'resources.update',
  RESOURCES_DELETE: 'resources.delete',

  // Professions
  PROFESSIONS_READ: 'professions.read',
  PROFESSIONS_CREATE: 'professions.create',
  PROFESSIONS_UPDATE: 'professions.update',
  PROFESSIONS_DELETE: 'professions.delete',

  // Users
  USERS_READ: 'users.read',
  USERS_CREATE: 'users.create',
  USERS_UPDATE: 'users.update',
  USERS_DELETE: 'users.delete',

  // Roles
  ROLES_READ: 'roles.read',
  ROLES_CREATE: 'roles.create',
  ROLES_UPDATE: 'roles.update',
  ROLES_DELETE: 'roles.delete',

  // Permissions
  PERMISSIONS_READ: 'permissions.read',
  PERMISSIONS_CREATE: 'permissions.create',
  PERMISSIONS_UPDATE: 'permissions.update',
  PERMISSIONS_DELETE: 'permissions.delete',
} as const;

export type PermissionKey = (typeof Perm)[keyof typeof Perm];
