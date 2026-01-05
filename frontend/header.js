// Load Header HTML
function loadHeader() {
    const headerContainer = document.getElementById('header-container');
    if (!headerContainer) {
        console.error('Header container not found');
        return;
    }
    
    // Inline header HTML to avoid fetch issues
    const headerHTML = `<header class="fixed-header">
    <div class="header-left">
        <h1>Government Disbursement</h1>
    </div>
    <div class="header-right">
        <div class="profile-dropdown">
            <button class="profile-btn" id="profile-btn" onclick="toggleProfileMenu()">
                <div class="profile-avatar" id="profile-avatar">
                    <img id="header-avatar-img" src="" alt="Profile" class="avatar-image" style="display:none;">
                    <span id="avatar-initials">U</span>
                </div>
                <span id="username-display" class="profile-username"></span>
                <i class="fa-solid fa-chevron-down"></i>
            </button>
            <div class="profile-menu" id="profile-menu">
                <div class="profile-menu-header">
                    <div class="menu-avatar" id="menu-avatar">
                        <img id="menu-avatar-img" src="" alt="Profile" class="avatar-image" style="display:none;">
                        <span id="menu-avatar-initials">U</span>
                    </div>
                    <div class="menu-user-info">
                        <p class="menu-username" id="menu-username"></p>
                        <p class="menu-role" id="menu-role"></p>
                    </div>
                </div>
                <hr>
                <button class="menu-item" id="view-profile" style="background: none; border: none; cursor: pointer; text-align: left; width: 100%; padding: 10px 15px;">
                    <i class="fa-solid fa-user"></i> View Profile
                </button>
            </div>
        </div>
        <button id="logout-btn" class="logout-btn" onclick="handleLogout()">
            <i class="fa-solid fa-sign-out-alt"></i> Logout
        </button>
    </div>
</header>`;
    
    headerContainer.innerHTML = headerHTML;
    setupProfileDisplay(
        localStorage.getItem('username') || 'User',
        localStorage.getItem('userRole') || 'guest'
    );
    console.log('[HEADER] Header loaded successfully');
}

// Logout function
function handleLogout() {
    try {
        // Step 1: Get username before clearing
        const username = localStorage.getItem('username') || 'User';
        console.log('[LOGOUT] Step 1: Retrieved username:', username);
        
        // Step 2: Clear localStorage
        localStorage.removeItem('userId');
        localStorage.removeItem('username');
        localStorage.removeItem('userRole');
        console.log('[LOGOUT] Step 2: Cleared localStorage');
        
        // Step 3: Show success popup
        showError('INVALID_CREDENTIALS', `Goodbye ${username}! You have been logged out successfully.`, true);
        console.log('[LOGOUT] Step 3: Success popup displayed');
        
        // Step 4: Redirect to login page
        setTimeout(() => {
            console.log('[LOGOUT] Step 4: Redirecting to login page');
            window.location.href = 'login.html';
        }, 2000);
    } catch (error) {
        console.error('[LOGOUT] Error:', error);
        // Still redirect even if there's an error
        window.location.href = 'login.html';
    }
}

// Profile Display Setup
function setupProfileDisplay(username, userRole) {
    // Get initials from username
    const initials = username.substring(0, 1).toUpperCase();
    
    // Update header profile button initials
    const avatarInitials = document.getElementById('avatar-initials');
    const usernameDisplay = document.getElementById('username-display');
    
    if (avatarInitials) {
        avatarInitials.textContent = initials;
    }
    
    if (usernameDisplay) {
        usernameDisplay.textContent = username;
    }
    
    // Update profile menu initials
    const menuAvatarInitials = document.getElementById('menu-avatar-initials');
    const menuUsername = document.getElementById('menu-username');
    const menuRole = document.getElementById('menu-role');
    
    if (menuAvatarInitials) {
        menuAvatarInitials.textContent = initials;
    }
    
    if (menuUsername) {
        menuUsername.textContent = username;
    }
    
    if (menuRole) {
        menuRole.textContent = userRole || 'user';
    }
    
    // Load profile picture from server
    const userId = localStorage.getItem('userId');
    if (userId) {
        console.log('[HEADER] Loading profile picture for user_id: ' + userId);
        fetch(`http://127.0.0.1:8000/user-info/${userId}`)
            .then(response => response.json())
            .then(data => {
                console.log('[HEADER] Profile data loaded');
                if (data.avatar_url) {
                    let avatarUrl = data.avatar_url;
                    if (!avatarUrl.startsWith('http')) {
                        avatarUrl = 'http://127.0.0.1:8000' + avatarUrl;
                    }
                    
                    console.log('[HEADER] Setting avatar image to: ' + avatarUrl);
                    
                    // Set header avatar image
                    const headerAvatarImg = document.getElementById('header-avatar-img');
                    if (headerAvatarImg) {
                        headerAvatarImg.src = avatarUrl;
                        headerAvatarImg.style.display = 'block';
                        const headerInitials = document.getElementById('avatar-initials');
                        if (headerInitials) {
                            headerInitials.style.display = 'none';
                        }
                    }
                    
                    // Set menu avatar image
                    const menuAvatarImg = document.getElementById('menu-avatar-img');
                    if (menuAvatarImg) {
                        menuAvatarImg.src = avatarUrl;
                        menuAvatarImg.style.display = 'block';
                        const menuInitials = document.getElementById('menu-avatar-initials');
                        if (menuInitials) {
                            menuInitials.style.display = 'none';
                        }
                    }
                }
            })
            .catch(error => {
                console.log('[HEADER] Error loading profile picture: ' + error.message);
            });
    }
    
    // Add click handler for View Profile button
    const viewProfileBtn = document.getElementById('view-profile');
    if (viewProfileBtn) {
        viewProfileBtn.addEventListener('click', function() {
            console.log('[PROFILE] View Profile button clicked');
            window.location.href = 'admin_profile.html';
        });
    }
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        const profileBtn = document.getElementById('profile-btn');
        const profileMenu = document.getElementById('profile-menu');
        
        if (profileBtn && profileMenu && !profileBtn.contains(e.target) && !profileMenu.contains(e.target)) {
            profileMenu.classList.remove('active');
            profileBtn.classList.remove('active');
        }
    });
}

// Toggle Profile Menu
function toggleProfileMenu() {
    const profileBtn = document.getElementById('profile-btn');
    const profileMenu = document.getElementById('profile-menu');
    
    if (profileBtn && profileMenu) {
        profileBtn.classList.toggle('active');
        profileMenu.classList.toggle('active');
    }
}

// Load header when DOM is ready or immediately if already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadHeader);
} else {
    loadHeader();
}
