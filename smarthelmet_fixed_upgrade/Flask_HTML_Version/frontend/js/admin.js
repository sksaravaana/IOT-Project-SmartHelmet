// Admin Functions
let adminData = {
    bikes: [],
    users: [],
    fleetData: null
};

let activeAdminTab = 'fleet';

async function loadAdmin() {
    const contentWrapper = document.getElementById('content-wrapper');
    
    contentWrapper.innerHTML = `
        <div class="admin-header">
            <h1>Admin Dashboard</h1>
            <p>Fleet management and system control</p>
        </div>
        
        <div id="admin-stats-grid" class="stats-grid">
            <!-- Stats will be loaded here -->
        </div>
        
        <div class="card">
            <div class="admin-tabs">
                <button class="admin-tab active" data-tab="fleet" onclick="switchAdminTab('fleet')">
                    <svg class="icon-tiny" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 19 L19 19 M12 19 L12 15 M8 15 L16 15 M8 15 L8 9 M16 15 L16 9 M8 9 L10 5 M16 9 L14 5 M10 5 L14 5"></path>
                    </svg>
                    Fleet Overview
                </button>
                <button class="admin-tab" data-tab="bikes" onclick="switchAdminTab('bikes')">
                    <svg class="icon-tiny" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M12 1v6m0 6v6m5.66-13.66l-4.24 4.24m0 6.84l4.24 4.24M23 12h-6m-6 0H1m18.66 5.66l-4.24-4.24m0-6.84l4.24-4.24"></path>
                    </svg>
                    Bike Management
                </button>
                <button class="admin-tab" data-tab="users" onclick="switchAdminTab('users')">
                    <svg class="icon-tiny" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    User Management
                </button>
                <button class="admin-tab" data-tab="alerts" onclick="switchAdminTab('alerts')">
                    <svg class="icon-tiny" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    Alert Management
                </button>
                <button class="admin-tab" data-tab="controls" onclick="switchAdminTab('controls')">
                    <svg class="icon-tiny" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                    Remote Controls
                </button>
            </div>
            
            <div id="admin-tab-content" style="padding: 24px;">
                <!-- Tab content will be loaded here -->
            </div>
        </div>
    `;
    
    await loadAdminData();
    renderAdminTab();
}

async function loadAdminData() {
    try {
        const [fleetResult, bikesResult, usersResult] = await Promise.all([
            API.getFleetOverview(),
            API.getBikes(),
            API.getUsers()
        ]);
        
        adminData.fleetData = fleetResult;
        adminData.bikes = bikesResult;
        adminData.users = usersResult;
        
        renderAdminStats();
    } catch (error) {
        console.error('Failed to load admin data:', error);
    }
}

function renderAdminStats() {
    const statsGrid = document.getElementById('admin-stats-grid');
    
    if (!adminData.fleetData) return;
    
    statsGrid.innerHTML = `
        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-icon bg-blue">
                    <svg class="icon-tiny" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M5 19 L19 19 M12 19 L12 15 M8 15 L16 15 M8 15 L8 9 M16 15 L16 9 M8 9 L10 5 M16 9 L14 5 M10 5 L14 5"></path>
                    </svg>
                </div>
                <span class="stat-label">Total Bikes</span>
            </div>
            <div class="stat-value">${adminData.fleetData.totalBikes || 0}</div>
        </div>
        
        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-icon bg-green">
                    <svg class="icon-tiny" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                </div>
                <span class="stat-label">Active Bikes</span>
            </div>
            <div class="stat-value">${adminData.fleetData.activeBikes || 0}</div>
        </div>
        
        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-icon bg-purple">
                    <svg class="icon-tiny" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                </div>
                <span class="stat-label">Total Users</span>
            </div>
            <div class="stat-value">${adminData.users.length || 0}</div>
        </div>
        
        <div class="stat-card">
            <div class="stat-header">
                <div class="stat-icon bg-red">
                    <svg class="icon-tiny" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                </div>
                <span class="stat-label">Active Alerts</span>
            </div>
            <div class="stat-value">0</div>
        </div>
    `;
}

function switchAdminTab(tab) {
    activeAdminTab = tab;
    
    // Update tab buttons
    document.querySelectorAll('.admin-tab').forEach(btn => {
        if (btn.dataset.tab === tab) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    renderAdminTab();
}

function renderAdminTab() {
    const content = document.getElementById('admin-tab-content');
    
    switch (activeAdminTab) {
        case 'fleet':
            renderFleetTab(content);
            break;
        case 'bikes':
            renderBikesTab(content);
            break;
        case 'users':
            renderUsersTab(content);
            break;
        case 'alerts':
            renderAlertsTab(content);
            break;
        case 'controls':
            renderControlsTab(content);
            break;
    }
}

function renderFleetTab(content) {
    if (!adminData.fleetData || !adminData.fleetData.bikes) {
        content.innerHTML = '<div class="empty-state"><p>No fleet data available</p></div>';
        return;
    }
    
    const bikesHtml = adminData.fleetData.bikes.map(bike => `
        <div class="bike-card">
            <div class="bike-card-header">
                <div style="flex: 1;">
                    <div class="bike-card-title">
                        <h4>${bike.bikeName || bike.bikeId}</h4>
                        <span class="badge ${bike.isActive ? 'badge-success' : 'badge-danger'}">
                            ${bike.isActive ? 'Active' : 'Inactive'}
                        </span>
                        ${bike.ignitionBlocked ? '<span class="badge badge-danger">Blocked</span>' : ''}
                    </div>
                    <div class="bike-info-grid">
                        <div class="bike-info-item">
                            <span>Bike ID:</span>
                            <p>${bike.bikeId}</p>
                        </div>
                        <div class="bike-info-item">
                            <span>Model:</span>
                            <p>${bike.bikeModel || '—'}</p>
                        </div>
                        <div class="bike-info-item">
                            <span>Helmet ID:</span>
                            <p>${bike.helmetId || 'Not paired'}</p>
                        </div>
                        <div class="bike-info-item">
                            <span>Owner:</span>
                            <p>${bike.ownerId?.username || '—'}</p>
                        </div>
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="margin-bottom: 8px;">
                        <span style="font-size: 0.875rem; color: #6b7280;">Success Rate:</span>
                        <p style="font-size: 1.125rem; font-weight: bold; color: #16a34a;">${bike.stats?.successRate || 0}%</p>
                    </div>
                    <div style="display: flex; gap: 8px; font-size: 0.75rem;">
                        <span style="color: #6b7280;">Rides: ${bike.stats?.totalRides || 0}</span>
                        <span style="color: #dc2626;">Alerts: ${bike.stats?.activeAlerts || 0}</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    content.innerHTML = `
        <h3 style="font-size: 1.125rem; font-weight: 600; color: #111827; margin-bottom: 16px;">Fleet Status</h3>
        <div style="display: flex; flex-direction: column; gap: 16px;">
            ${bikesHtml}
        </div>
    `;
}

function renderBikesTab(content) {
    const bikesRows = adminData.bikes.map(bike => `
        <tr>
            <td>${bike.bikeId}</td>
            <td>${bike.bikeName || '—'}</td>
            <td>${bike.bikeModel || '—'}</td>
            <td>${bike.helmetId || 'Not paired'}</td>
            <td>
                <span class="badge ${bike.isActive ? 'badge-success' : 'badge-danger'}">
                    ${bike.isActive ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm ${bike.ignitionBlocked ? 'btn-success' : 'btn-danger'}" 
                        onclick="handleIgnitionControl('${bike.bikeId}', ${!bike.ignitionBlocked})">
                    ${bike.ignitionBlocked ? 'Unlock' : 'Lock'}
                </button>
            </td>
        </tr>
    `).join('');
    
    content.innerHTML = `
        <div style="margin-bottom: 24px;">
            <h3 style="font-size: 1.125rem; font-weight: 600; color: #111827; margin-bottom: 16px;">Add New Bike</h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 16px;">
                <input type="text" id="new-bike-id" placeholder="Bike ID *" class="form-group" style="padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <input type="text" id="new-bike-name" placeholder="Bike Name" class="form-group" style="padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <input type="text" id="new-bike-model" placeholder="Model" class="form-group" style="padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <input type="text" id="new-bike-reg" placeholder="Registration Number" class="form-group" style="padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px;">
            </div>
            <button class="btn btn-primary" onclick="handleCreateBike()">Add Bike</button>
        </div>
        
        <h3 style="font-size: 1.125rem; font-weight: 600; color: #111827; margin-bottom: 16px;">Existing Bikes</h3>
        <div style="overflow-x: auto;">
            <table>
                <thead>
                    <tr>
                        <th>Bike ID</th>
                        <th>Name</th>
                        <th>Model</th>
                        <th>Helmet</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${bikesRows}
                </tbody>
            </table>
        </div>
    `;
}

function renderUsersTab(content) {
    const usersRows = adminData.users.map(user => `
        <tr>
            <td>${user.username}</td>
            <td>${user.email || '—'}</td>
            <td>${user.phone || '—'}</td>
            <td>
                <span class="badge ${user.role === 'admin' ? 'badge-purple' : 'badge-info'}">
                    ${user.role}
                </span>
            </td>
            <td>
                <span class="badge ${user.isActive ? 'badge-success' : 'badge-danger'}">
                    ${user.isActive ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>${new Date(user.createdAt).toLocaleDateString()}</td>
        </tr>
    `).join('');
    
    content.innerHTML = `
        <h3 style="font-size: 1.125rem; font-weight: 600; color: #111827; margin-bottom: 16px;">Registered Users</h3>
        <div style="overflow-x: auto;">
            <table>
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Joined</th>
                    </tr>
                </thead>
                <tbody>
                    ${usersRows}
                </tbody>
            </table>
        </div>
    `;
}

function renderAlertsTab(content) {
    content.innerHTML = `
        <div class="empty-state">
            <p>Alert notifications have been disabled</p>
        </div>
    `;
}

function renderControlsTab(content) {
    const bikeOptions = adminData.bikes.map(bike => 
        `<option value="${bike.bikeId}">${bike.bikeId} - ${bike.bikeName || bike.bikeId}</option>`
    ).join('');
    
    const bikeCards = adminData.bikes.map(bike => `
        <div class="bike-card">
            <h4 style="font-weight: 600; color: #111827; margin-bottom: 8px;">${bike.bikeName || bike.bikeId}</h4>
            <p style="font-size: 0.875rem; color: #6b7280; margin-bottom: 12px;">
                Status: 
                <span class="badge ${bike.ignitionBlocked ? 'badge-danger' : 'badge-success'}">
                    ${bike.ignitionBlocked ? 'Blocked' : 'Allowed'}
                </span>
            </p>
            <div class="btn-group">
                <button class="btn btn-sm btn-danger" 
                        onclick="handleIgnitionControl('${bike.bikeId}', true)"
                        ${bike.ignitionBlocked ? 'disabled' : ''}>
                    Block
                </button>
                <button class="btn btn-sm btn-success" 
                        onclick="handleIgnitionControl('${bike.bikeId}', false)"
                        ${!bike.ignitionBlocked ? 'disabled' : ''}>
                    Allow
                </button>
            </div>
        </div>
    `).join('');
    
    content.innerHTML = `
        <div style="margin-bottom: 24px;">
            <h3 style="font-size: 1.125rem; font-weight: 600; color: #111827; margin-bottom: 16px;">Helmet Pairing</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr auto; gap: 16px;">
                <select id="pair-bike-select" style="padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px;">
                    <option value="">Select Bike</option>
                    ${bikeOptions}
                </select>
                <input type="text" id="pair-helmet-id" placeholder="Helmet ID" style="padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <button class="btn btn-primary" onclick="handlePairHelmet()">Pair Helmet</button>
            </div>
        </div>
        
        <h3 style="font-size: 1.125rem; font-weight: 600; color: #111827; margin-bottom: 16px;">Ignition Control</h3>
        <div class="grid-3">
            ${bikeCards}
        </div>
    `;
}

async function handleCreateBike() {
    const bikeId = document.getElementById('new-bike-id').value;
    const bikeName = document.getElementById('new-bike-name').value;
    const bikeModel = document.getElementById('new-bike-model').value;
    const registrationNumber = document.getElementById('new-bike-reg').value;
    
    if (!bikeId) {
        alert('Bike ID is required');
        return;
    }
    
    try {
        await API.createBike({ bikeId, bikeName, bikeModel, registrationNumber });
        alert('Bike created successfully');
        
        // Clear form
        document.getElementById('new-bike-id').value = '';
        document.getElementById('new-bike-name').value = '';
        document.getElementById('new-bike-model').value = '';
        document.getElementById('new-bike-reg').value = '';
        
        // Reload data
        await loadAdminData();
        renderAdminTab();
    } catch (error) {
        console.error('Failed to create bike:', error);
        alert('Failed to create bike');
    }
}

async function handleIgnitionControl(bikeId, block) {
    try {
        await API.setIgnition(bikeId, block);
        alert(`Ignition ${block ? 'blocked' : 'unblocked'} for bike ${bikeId}`);
        
        // Reload data
        await loadAdminData();
        renderAdminTab();
    } catch (error) {
        console.error('Failed to control ignition:', error);
        alert('Failed to control ignition');
    }
}

async function handlePairHelmet() {
    const bikeId = document.getElementById('pair-bike-select').value;
    const helmetId = document.getElementById('pair-helmet-id').value;
    
    if (!bikeId || !helmetId) {
        alert('Please select bike and enter helmet ID');
        return;
    }
    
    try {
        await API.pairHelmet(bikeId, helmetId);
        alert('Helmet paired successfully');
        
        // Clear form
        document.getElementById('pair-bike-select').value = '';
        document.getElementById('pair-helmet-id').value = '';
        
        // Reload data
        await loadAdminData();
        renderAdminTab();
    } catch (error) {
        console.error('Failed to pair helmet:', error);
        alert('Failed to pair helmet');
    }
}
