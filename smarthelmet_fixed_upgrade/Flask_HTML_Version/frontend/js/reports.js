// Reports Functions
async function loadReports() {
    const contentWrapper = document.getElementById('content-wrapper');
    
    contentWrapper.innerHTML = `
        <div class="card">
            <button class="btn btn-outline" onclick="loadDashboard()" style="margin-bottom: 16px;">
                <svg class="icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                <span>Back</span>
            </button>
            <h1 style="font-size: 1.875rem; font-weight: bold; color: #111827; margin-bottom: 4px;">Reports & Analytics</h1>
            <p style="color: #6b7280;">Essential data and insights</p>
        </div>
        
        <div class="card">
            <h2 style="font-size: 1.25rem; font-weight: 600; color: #111827; margin-bottom: 8px;">Rides Over Time</h2>
            <p style="font-size: 0.875rem; color: #6b7280; margin-bottom: 24px;">Daily ride statistics</p>
            <div class="empty-state">
                <p>No ride data available</p>
            </div>
        </div>
        
        <div class="grid-2">
            <!-- Chart Card -->
            <div class="card">
                <h2 style="font-size: 1.25rem; font-weight: 600; color: #111827; margin-bottom: 8px;">Ignition Attempt Distribution</h2>
                <p style="font-size: 0.875rem; color: #6b7280; margin-bottom: 24px;">Breakdown of all start attempts</p>
                <canvas id="reports-chart"></canvas>
            </div>
            
            <!-- Summary Card -->
            <div class="card">
                <h2 style="font-size: 1.25rem; font-weight: 600; color: #111827; margin-bottom: 8px;">Summary Statistics</h2>
                <p style="font-size: 0.875rem; color: #6b7280; margin-bottom: 24px;">Overall performance metrics</p>
                <div id="summary-stats" style="display: flex; flex-direction: column; gap: 12px;">
                    <!-- Stats will be inserted here -->
                </div>
            </div>
        </div>
    `;
    
    // Load stats and render chart
    await loadReportsData();
}

async function loadReportsData() {
    try {
        const result = await API.getDashboardStats(CONFIG.BIKE_ID);
        
        if (result.summary) {
            const stats = result.summary;
            
            // Render summary stats
            const summaryDiv = document.getElementById('summary-stats');
            summaryDiv.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px; background: #f9fafb; border-radius: 8px;">
                    <span style="color: #374151; font-weight: 500;">Total Attempts</span>
                    <span style="font-size: 1.5rem; font-weight: bold; color: #111827;">${stats.totalRides || 0}</span>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px; background: #dcfce7; border-radius: 8px;">
                    <span style="color: #15803d; font-weight: 500;">Successful</span>
                    <span style="font-size: 1.5rem; font-weight: bold; color: #16a34a;">${stats.successfulRides || 0}</span>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px; background: #fed7aa; border-radius: 8px;">
                    <span style="color: #b45309; font-weight: 500;">Helmet Violations</span>
                    <span style="font-size: 1.5rem; font-weight: bold; color: #d97706;">${stats.helmetAttempts || 0}</span>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px; background: #fee2e2; border-radius: 8px;">
                    <span style="color: #b91c1c; font-weight: 500;">Alcohol Detections</span>
                    <span style="font-size: 1.5rem; font-weight: bold; color: #dc2626;">${stats.alcoholAttempts || 0}</span>
                </div>
            `;
            
            // Render chart
            const ctx = document.getElementById('reports-chart');
            if (ctx && typeof Chart !== 'undefined') {
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['Helmet Attempts', 'Alcohol Attempts', 'Successful Rides'],
                        datasets: [{
                            label: 'Count',
                            data: [stats.helmetAttempts || 0, stats.alcoholAttempts || 0, stats.successfulRides || 0],
                            backgroundColor: [
                                'rgba(251, 146, 60, 0.8)',
                                'rgba(239, 68, 68, 0.8)',
                                'rgba(34, 197, 94, 0.8)'
                            ],
                            borderRadius: 8
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    stepSize: 1
                                }
                            }
                        }
                    }
                });
            }
        }
    } catch (error) {
        console.error('Failed to load reports data:', error);
    }
}
