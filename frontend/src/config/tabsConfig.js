const tabsConfig = [
  { name: 'Account', route: '/settings', roles: ['admin','receptionist'] },
  { name: 'Activity', route: '/activity-log', roles: ['admin'] },
  { name: 'Departments', route: '/department-management', roles: ['admin'] },
  { name: 'Test', route: '/test-management', roles: ['admin'] },
  { name: 'Referrer', route: '/referral-management', roles: ['admin'] }
];

export default tabsConfig;
