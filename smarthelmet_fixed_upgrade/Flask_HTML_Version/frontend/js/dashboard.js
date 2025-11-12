// Dashboard Functions
let dashboardStats = {
    totalRides: 24,
    successfulRides: 20,
    helmetViolations: 3,
    alcoholDetections: 1
};

let currentStatus = {
    helmet: 'worn',
    alcohol: 'clear',
    alcoholLevel: 0,
    battery: 85
};

// Simulate status updates
function simulateStatusUpdates() {
    // Toggle helmet status every 10 seconds
    setInterval(() => {
        currentStatus.helmet = currentStatus.helmet === 'worn' ? 'not_worn' : 'worn';
        updateStatusDisplay();
    }, 10000);

    // Update battery level
    setInterval(() => {
        currentStatus.battery = Math.max(10, currentStatus.battery - 1);
        if (currentStatus.battery <= 10) {
            currentStatus.battery = 85; // Reset battery
        }
        updateStatusDisplay();
    }, 30000);
}

async function loadDashboard() {
    const contentWrapper = document.getElementById('content-wrapper');
    
    // Start simulating status updates
    simulateStatusUpdates();
    
    contentWrapper.innerHTML = `
        <div class="stats-grid" id="stats-grid">
            <!-- Stats cards will be inserted here -->
        </div>
        
        <div class="grid-2">
            <!-- Helmet Status Card -->
            <div class="card">
                <div class="card-header">
                    <div class="card-icon bg-blue">
                        <svg class="icon-tiny" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        </svg>
                    </div>
                    <div class="card-title">
                        <h3>Helmet Status</h3>
                        <p>Real-time helmet monitoring</p>
                    </div>
                </div>
                <div id="helmet-status-display" class="status-display">
                    <div class="status-icon-large blue">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        </svg>
                    </div>
                    <div class="status-text">No Data</div>
                </div>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-icon bg-blue" id="helmet-icon">
                            <svg class="icon-tiny" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                            </svg>
                        </div>
                        <div class="info-content">
                            <div class="info-label">Helmet Status</div>
                            <div class="info-value" id="helmet-status-text">—</div>
                        </div>
                    </div>
                    <div class="info-item">
                        <div class="info-icon bg-green" id="alcohol-icon">
                            <svg class="icon-tiny" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                <line x1="12" y1="9" x2="12" y2="13"></line>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                        </div>
                        <div class="info-content">
                            <div class="info-label">Alcohol Test</div>
                            <div class="info-value" id="alcohol-status-text">—</div>
                        </div>
                    </div>
                    <div class="info-item" style="grid-column: span 2;">
                        <div class="info-icon bg-blue">
                            <svg class="icon-tiny" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="1" y="6" width="18" height="12" rx="2" ry="2"></rect>
                                <line x1="23" y1="13" x2="23" y2="11"></line>
                            </svg>
                        </div>
                        <div class="info-content">
                            <div class="info-label">Battery Level</div>
                            <div class="info-value" id="battery-level">0%</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Bike Status Card -->
            <div class="card">
                <div class="card-header">
                    <div class="card-icon bg-blue">
                        <svg class="icon-tiny" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M5 19 L19 19 M12 19 L12 15 M8 15 L16 15 M8 15 L8 9 M16 15 L16 9 M8 9 L10 5 M16 9 L14 5 M10 5 L14 5"></path>
                        </svg>
                    </div>
                    <div class="card-title">
                        <h3>Bike Status</h3>
                        <p>Real-time ignition control</p>
                    </div>
                    <div class="status-indicator red"></div>
                </div>
                <div class="empty-state">
                    <p>No bike configured</p>
                    <p style="font-size: 0.75rem; margin-top: 8px;">Connect your bike to see real-time status</p>
                </div>
            </div>
        </div>
    `;
    
    // Load stats
    await loadDashboardStats();
    
    // Setup socket listeners
    onStatusUpdate(handleStatusUpdate);
}

async function loadDashboardStats() {
    try {
        const result = await API.getDashboardStats(CONFIG.BIKE_ID);
        
        if (result.summary) {
            dashboardStats = result.summary;
            renderStatsCards();
        }
    } catch (error) {
        console.error('Failed to load dashboard stats:', error);
    }
}

function renderStatsCards() {
    const statsGrid = document.getElementById('stats-grid');
    
    statsGrid.innerHTML = `
        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-icon bg-blue">
                    <svg class="icon-tiny" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                </div>
                <span class="stat-label">Total Rides</span>
            </div>
            <div class="stat-value">${dashboardStats.totalRides || 0}</div>
        </div>
        
        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-icon bg-green">
                    <svg class="icon-tiny" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                </div>
                <span class="stat-label">Successful Rides</span>
            </div>
            <div class="stat-value">${dashboardStats.successfulRides || 0}</div>
        </div>
        
        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-icon bg-yellow">
                    <svg class="icon-tiny" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                </div>
                <span class="stat-label">Helmet Violations</span>
            </div>
            <div class="stat-value">${dashboardStats.helmetAttempts || 0}</div>
        </div>
        
        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-icon bg-red">
                    <svg class="icon-tiny" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                </div>
                <span class="stat-label">Alcohol Detections</span>
            </div>
            <div class="stat-value">${dashboardStats.alcoholAttempts || 0}</div>
        </div>
    `;
}

function handleStatusUpdate(data) {
    // This function is kept for compatibility but won't be used with MQTT disabled
    console.log('Status update received (MQTT disabled):', data);
}

function updateStatusDisplay() {
    // Helmet Status
    const helmetDisplay = document.getElementById('helmet-status-display');
    const helmetIcon = document.getElementById('helmet-icon');
    const helmetText = document.querySelector('#helmet-status-display .status-text');
    
    if (currentStatus.helmet === 'worn') {
        helmetDisplay.classList.remove('status-error');
        helmetDisplay.classList.add('status-success');
        helmetIcon.innerHTML = `
            <svg class="icon-tiny" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>`;
        helmetText.textContent = 'WORN';
    } else if (currentStatus.helmet === 'not_worn') {
        helmetDisplay.classList.remove('status-success');
        helmetDisplay.classList.add('status-error');
        helmetIcon.innerHTML = `
            <svg class="icon-tiny" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>`;
        helmetText.textContent = 'NOT WORN';
    } else {
        helmetDisplay.classList.remove('status-success', 'status-error');
        helmetText.textContent = 'NO DATA';
    }

    // Alcohol Status
    const alcoholStatusText = document.getElementById('alcohol-status-text');
    const alcoholIcon = document.getElementById('alcohol-icon');
    
    if (currentStatus.alcohol === 'clear') {
        alcoholIcon.className = 'info-icon bg-green';
        alcoholStatusText.textContent = 'Clear ✓';
    } else if (currentStatus.alcohol === 'detected') {
        alcoholIcon.className = 'info-icon bg-red';
        alcoholStatusText.textContent = 'Detected ✗';
    } else {
        alcoholIcon.className = 'info-icon bg-gray';
        alcoholStatusText.textContent = '—';
    }

    // Update battery level
    const batteryLevel = document.getElementById('battery-level');
    const batteryText = document.getElementById('battery-text');
    if (batteryLevel && batteryText) {
        const width = Math.min(100, Math.max(0, currentStatus.battery));
        batteryLevel.style.width = `${width}%`;
        batteryText.textContent = `${width}%`;
        
        if (width < 20) {
            batteryLevel.className = 'battery-level bg-red';
        } else if (width < 50) {
            batteryLevel.className = 'battery-level bg-yellow';
        } else {
            batteryLevel.className = 'battery-level bg-green';
        }
    }
}
