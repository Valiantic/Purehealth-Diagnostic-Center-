const tabsConfig = [
  { name: 'Account', route: '/settings', permission: 'accounts.view' },
  { name: 'Activity', route: '/activity-log', permission: 'activitylog.view' },
  { name: 'Departments', route: '/department-management', permission: 'departments.manage' },
  { name: 'Test', route: '/test-management', permission: 'tests.manage' },
  { name: 'Referrer', route: '/referral-management', permission: 'referrals.view' },
  { name: 'Roles', route: '/settings/roles', permission: 'roles.manage' }
];

export default tabsConfig;

