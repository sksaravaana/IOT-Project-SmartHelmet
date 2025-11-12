// Main Application Logic
let currentView = 'landing';

// Initialize app on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    if (initializeAuth()) {
        showApp();
    } else {
        // Skip landing page and go directly to login
        showAuth();
    }
});

// Navigation Setup
function setupNavigation() {
    const sidebarNav = document.getElementById('sidebar-nav');
    const userName = document.getElementById('user-name');
    
    // Update user name
    if (currentUser) {
        userName.textContent = currentUser.username;
    }
    
    // Define menu items based on user role
    const menuItems = [
        { 
            id: 'dashboard', 
            label: 'Dashboard', 
            icon: `<svg class="icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
            </svg>`,
            roles: ['rider', 'admin']
        },
        { 
            id: 'reports', 
            label: 'Reports', 
            icon: `<svg class="icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>`,
            roles: ['rider', 'admin']
        },
        { 
            id: 'admin', 
            label: 'Admin Panel', 
            icon: `<svg class="icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>`,
            roles: ['admin']
        }
    ];
    
    // Filter menu items based on user role
    const visibleItems = menuItems.filter(item => 
        !item.roles || item.roles.includes(currentUser?.role)
    );
    
    // Render navigation items
    sidebarNav.innerHTML = visibleItems.map(item => `
        <button class="nav-item ${item.id === 'dashboard' ? 'active' : ''}" 
                data-view="${item.id}" 
                onclick="navigateTo('${item.id}')">
            ${item.icon}
            <span>${item.label}</span>
        </button>
    `).join('');
}

// Navigation Handler
function navigateTo(view) {
    currentView = view;
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.dataset.view === view) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Clear socket callbacks before loading new view
    clearSocketCallbacks();
    
    // Load the appropriate view
    switch (view) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'reports':
            loadReports();
            break;
        case 'admin':
            if (currentUser?.role === 'admin') {
                loadAdmin();
            }
            break;
        default:
            loadDashboard();
    }
}

// Show loading spinner
function showLoading() {
    document.getElementById('loading-spinner').style.display = 'flex';
}

// Hide loading spinner
function hideLoading() {
    document.getElementById('loading-spinner').style.display = 'none';
}

// Error handler
function handleError(error, message = 'An error occurred') {
    console.error(error);
    alert(message);
}

// Utility function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Utility function to format time
function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Utility function to format datetime
function formatDateTime(dateString) {
    return `${formatDate(dateString)} ${formatTime(dateString)}`;
}

// Handle window resize
window.addEventListener('resize', () => {
    // Handle responsive layout changes if needed
});

// Handle page visibility change
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden
        console.log('Page hidden');
    } else {
        // Page is visible
        console.log('Page visible');
        // Refresh data if needed
        if (currentView === 'dashboard' && currentUser) {
            loadDashboardStats();
        }
    }
});

// Prevent accidental page refresh
window.addEventListener('beforeunload', (e) => {
    // Only show warning if user is logged in
    if (currentUser) {
        // Most browsers will show their own message
        e.preventDefault();
        e.returnValue = '';
    }
});

console.log('Smart Helmet Safety System - Frontend Loaded');
