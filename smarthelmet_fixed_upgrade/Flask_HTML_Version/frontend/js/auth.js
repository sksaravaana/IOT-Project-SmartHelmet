// Authentication Functions
function showLanding() {
    document.getElementById('landing-page').classList.add('active');
    document.getElementById('auth-page').classList.remove('active');
    document.getElementById('app-page').classList.remove('active');
}

function showLogin() {
    document.getElementById('landing-page').classList.remove('active');
    document.getElementById('auth-page').classList.add('active');
    document.getElementById('app-page').classList.remove('active');
    switchAuthTab('signin');
}

function showApp() {
    document.getElementById('landing-page').classList.remove('active');
    document.getElementById('auth-page').classList.remove('active');
    document.getElementById('app-page').classList.add('active');
    
    // Initialize socket connection
    initializeSocket();
    subscribeToBike(CONFIG.BIKE_ID);
    
    // Setup navigation
    setupNavigation();
    
    // Load default view
    loadDashboard();
}

function switchAuthTab(tab) {
    const signinTab = document.getElementById('signin-tab');
    const signupTab = document.getElementById('signup-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authTitle = document.getElementById('auth-title-text');
    const authSubtitle = document.getElementById('auth-subtitle-text');
    
    if (tab === 'signin') {
        signinTab.classList.add('active');
        signupTab.classList.remove('active');
        loginForm.style.display = 'flex';
        registerForm.style.display = 'none';
        authTitle.textContent = 'Welcome';
        authSubtitle.textContent = 'Sign in to access your safety dashboard';
    } else {
        signinTab.classList.remove('active');
        signupTab.classList.add('active');
        loginForm.style.display = 'none';
        registerForm.style.display = 'flex';
        authTitle.textContent = 'Create Account';
        authSubtitle.textContent = 'Sign up to get started with Smart Helmet Safety System';
    }
    
    // Clear error messages
    document.getElementById('login-error').classList.remove('show');
    document.getElementById('register-error').classList.remove('show');
    document.getElementById('register-success').classList.remove('show');
}

// Login Form Handler
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');
    const btnText = document.getElementById('login-btn-text');
    
    errorDiv.classList.remove('show');
    btnText.textContent = 'Signing in...';
    
    try {
        const result = await API.login(username, password);
        
        if (result.ok && result.token) {
            saveAuth(result.token, result.user);
            showApp();
        } else {
            let errorMessage = 'Login failed. Please check your credentials.';
            if (result.error === 'invalid') {
                errorMessage = 'Invalid username or password';
            } else if (result.error === 'missing') {
                errorMessage = 'Please enter both username and password';
            }
            errorDiv.textContent = errorMessage;
            errorDiv.classList.add('show');
        }
    } catch (error) {
        console.error('Login error:', error);
        errorDiv.textContent = 'An error occurred. Please try again.';
        errorDiv.classList.add('show');
    } finally {
        btnText.textContent = 'Sign In';
    }
});

// Register Form Handler
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const errorDiv = document.getElementById('register-error');
    const successDiv = document.getElementById('register-success');
    const btnText = document.getElementById('register-btn-text');
    
    // Clear previous messages
    errorDiv.classList.remove('show');
    successDiv.classList.remove('show');
    
    // Client-side validation
    if (!username || !password || !confirmPassword) {
        errorDiv.textContent = 'Please fill in all fields';
        errorDiv.classList.add('show');
        return;
    }
    
    if (username.length < 3) {
        errorDiv.textContent = 'Username must be at least 3 characters long';
        errorDiv.classList.add('show');
        return;
    }
    
    if (password.length < 6) {
        errorDiv.textContent = 'Password must be at least 6 characters';
        errorDiv.classList.add('show');
        return;
    }
    
    if (password !== confirmPassword) {
        errorDiv.textContent = 'Passwords do not match';
        errorDiv.classList.add('show');
        return;
    }
    
    btnText.textContent = 'Creating account...';
    
    try {
        console.log('Attempting to register user:', username);
        const result = await API.register(username, password);
        console.log('Registration response:', result);
        
        if (result.ok) {
            successDiv.textContent = 'Registration successful! Switching to sign in...';
            successDiv.classList.add('show');
            
            // Clear form
            document.getElementById('register-username').value = '';
            document.getElementById('register-password').value = '';
            document.getElementById('register-confirm-password').value = '';
            
            // Switch to login after a delay
            setTimeout(() => {
                switchAuthTab('signin');
                document.getElementById('login-username').value = username;
                document.getElementById('login-password').focus();
            }, 1500);
        } else {
            // Handle different error cases
            let errorMessage = result.message || 'Registration failed. Please try again.';
            
            if (result.error === 'exists') {
                errorMessage = `Username '${username}' is already taken. Please choose a different username.`;
            } else if (result.error === 'missing') {
                errorMessage = 'Please provide all required fields';
            } else if (result.error === 'database') {
                errorMessage = 'Database error. Please try again later.';
            } else if (result.error === 'creation_failed') {
                errorMessage = 'Failed to create user. Please try again.';
            } else if (result.error === 'server_error') {
                errorMessage = 'Server error occurred. Please try again later.';
            }
            
            errorDiv.textContent = errorMessage;
            errorDiv.classList.add('show');
        }
    } catch (error) {
        console.error('Registration error:', error);
        errorDiv.textContent = `An error occurred: ${error.message || 'Please try again'}`;
        errorDiv.classList.add('show');
    } finally {
        btnText.textContent = 'Sign Up';
    }
});

function handleLogout() {
    clearAuth();
    disconnectSocket();
    showLanding();
}
