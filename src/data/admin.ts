export const adminStats = {
    totalUsers: 5420,
    totalManagers: 45,
    systemUptime: 99.9,
    monthlyRegistrations: 120,
    recentActivity: [
        { id: 1, type: 'New Company', detail: 'Tech Innovation Brasil registered.', date: '2025-12-01', status: 'success' },
        { id: 2, type: 'DB Backup', detail: 'Daily database backup completed.', date: '2025-12-01', status: 'info' },
        { id: 3, type: 'API Alert', detail: 'High latency detected in Payment Gateway.', date: '2025-11-30', status: 'warning' },
        { id: 4, type: 'User Blocked', detail: 'User 1234 blocked due to suspicious activity.', date: '2025-11-30', status: 'error' },
        { id: 5, type: 'New Event', detail: 'Concerto Sinfônico Premium created.', date: '2025-11-29', status: 'success' },
    ],
    platformHealth: [
        { name: 'API Latency (ms)', value: 45, threshold: 100, unit: 'ms' },
        { name: 'DB Connections', value: 12, threshold: 50, unit: '' },
        { name: 'Storage Usage (%)', value: 65, threshold: 90, unit: '%' },
    ]
};