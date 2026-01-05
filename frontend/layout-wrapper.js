/**
 * Layout Wrapper - Higher-Order Component for consistent page layout
 * Provides header and sidebar on all pages
 */

function initializeLayout() {
    // Ensure body has correct structure
    const body = document.body;
    
    // Create main layout container if it doesn't exist
    let layoutContainer = document.querySelector('.main-layout');
    if (!layoutContainer) {
        layoutContainer = document.createElement('div');
        layoutContainer.className = 'main-layout';
        
        // Move existing header and container into layout
        const headerContainer = document.getElementById('header-container');
        const container = document.querySelector('.container');
        
        if (headerContainer && container) {
            layoutContainer.appendChild(headerContainer);
            layoutContainer.appendChild(container);
            body.appendChild(layoutContainer);
        }
    }
    
    console.log('[LAYOUT] Layout wrapper initialized');
}

// Initialize layout when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLayout);
} else {
    initializeLayout();
}
