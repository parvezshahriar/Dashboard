// Upload History Page - Fetch and display batch uploads
let uploadHistoryData = [];
let currentPage = 1;
let itemsPerPage = 10;

// Get user info
function getUserRole() {
    return localStorage.getItem('userRole') || 'guest';
}

function getUserId() {
    return localStorage.getItem('userId') || null;
}

// Fetch batch uploads from database
async function fetchBatchUploads() {
    try {
        const userId = getUserId();
        const url = userId ? `http://127.0.0.1:8000/batch-uploads?user_id=${userId}` : 'http://127.0.0.1:8000/batch-uploads';
        
        console.log('[FETCH] Starting fetch batch uploads from', url);
        const response = await fetch(url);
        console.log('[FETCH] Response status:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        uploadHistoryData = await response.json();
        console.log('[FETCH] Received batch uploads:', uploadHistoryData);
        
        currentPage = 1;
        return uploadHistoryData;
    } catch (error) {
        console.error('[FETCH] Error fetching batch uploads:', error);
        showError('SERVER_NOT_CONNECTED', 'Failed to load batch uploads from database. Please check if the server is running.');
        return [];
    }
}

// Render upload history table
function renderUploadHistoryTable(data) {
    const tableBody = document.getElementById('table-body');
    tableBody.innerHTML = '';
    
    // Calculate pagination
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = data.slice(startIndex, endIndex);
    
    pageData.forEach((batch, index) => {
        const serialNo = startIndex + index + 1;
        
        // Format date
        const formatDate = (timestamp) => {
            if (!timestamp) return '-';
            return timestamp;
        };
        
        // Format currency
        const formatMoney = (amount) => amount ? `৳ ${parseFloat(amount).toFixed(2)}` : '৳ 0.00';
        
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>${serialNo}</td>
            <td>${formatDate(batch.upload_date)}</td>
            <td>${batch.batch_name || '-'}</td>
            <td>${batch.total_rows || 0}</td>
            <td style="font-weight:bold;">${formatMoney(batch.total_amount)}</td>
            <td style="font-weight:bold;">${formatMoney(batch.disbursed_amount)}</td>
            <td>
                <span class="status ${getStatusClass(batch.status)}">
                    ${batch.status || 'Pending'}
                </span>
            </td>
            <td class="actions">
                <i class="fa-regular fa-eye action-view" title="View Details" onclick="openDetailsModal(${JSON.stringify(batch).replace(/"/g, '&quot;')})" style="cursor:pointer;"></i>
                <i class="fa-solid fa-download action-download" title="Download Batch" style="cursor:pointer;"></i>
            </td>
        `;
        
        tableBody.appendChild(tr);
    });
    
    // Update pagination controls
    updateUploadHistoryPagination(totalPages);
}

// Get status class for styling
function getStatusClass(status) {
    const lower = status.toLowerCase();
    if (lower.includes('pending')) return 'pending';
    if (lower.includes('completed')) return 'completed';
    if (lower.includes('progress')) return 'in-progress';
    if (lower.includes('failed')) return 'failed';
    return '';
}

// Update pagination
function updateUploadHistoryPagination(totalPages) {
    const paginationContainer = document.querySelector('.pagination');
    if (!paginationContainer) return;
    
    paginationContainer.innerHTML = '';
    
    if (totalPages === 0) {
        paginationContainer.innerHTML = '<span style="color: #999;">No data to paginate</span>';
        return;
    }
    
    // Previous button
    const prevBtn = document.createElement('span');
    prevBtn.textContent = 'Previous';
    prevBtn.style.cursor = currentPage > 1 ? 'pointer' : 'not-allowed';
    prevBtn.style.color = currentPage > 1 ? '#666' : '#ccc';
    prevBtn.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            applyUploadHistoryFilters();
        }
    };
    paginationContainer.appendChild(prevBtn);
    
    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        const pageNum = document.createElement('span');
        pageNum.className = 'page-num' + (i === currentPage ? ' active' : '');
        pageNum.textContent = i;
        pageNum.style.cursor = 'pointer';
        pageNum.onclick = () => {
            currentPage = i;
            applyUploadHistoryFilters();
        };
        paginationContainer.appendChild(pageNum);
    }
    
    // Next button
    const nextBtn = document.createElement('span');
    nextBtn.textContent = 'Next';
    nextBtn.style.cursor = currentPage < totalPages ? 'pointer' : 'not-allowed';
    nextBtn.style.color = currentPage < totalPages ? '#666' : '#ccc';
    nextBtn.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            applyUploadHistoryFilters();
        }
    };
    paginationContainer.appendChild(nextBtn);
}

// Apply filters
function applyUploadHistoryFilters() {
    let filteredData = [...uploadHistoryData];
    
    // Search filter
    const searchInput = document.getElementById('search-input');
    if (searchInput && searchInput.value) {
        const searchTerm = searchInput.value.toLowerCase();
        filteredData = filteredData.filter(batch => {
            return (
                (batch.batch_name && batch.batch_name.toLowerCase().includes(searchTerm)) ||
                (batch.status && batch.status.toLowerCase().includes(searchTerm))
            );
        });
    }
    
    // Date filter
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    
    if (startDateInput && endDateInput && startDateInput.value && endDateInput.value) {
        const [startYear, startMonth, startDay] = startDateInput.value.split('-').map(Number);
        const [endYear, endMonth, endDay] = endDateInput.value.split('-').map(Number);
        
        const startDate = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
        const endDate = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);
        
        filteredData = filteredData.filter(batch => {
            if (!batch.upload_date) return false;
            
            // Parse backend formatted date: "DD/MM/YYYY HH:MM:SS"
            const dateParts = batch.upload_date.split(' ')[0].split('/');
            if (dateParts.length !== 3) return false;
            
            const day = parseInt(dateParts[0], 10);
            const month = parseInt(dateParts[1], 10);
            const year = parseInt(dateParts[2], 10);
            
            const batchDate = new Date(year, month - 1, day, 0, 0, 0, 0);
            return batchDate >= startDate && batchDate <= endDate;
        });
    }
    
    renderUploadHistoryTable(filteredData);
}

// Reset date filter
function resetUploadDateFilter() {
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    
    if (startDateInput) startDateInput.value = '';
    if (endDateInput) endDateInput.value = '';
    
    currentPage = 1;
    applyUploadHistoryFilters();
    console.log('[FILTER] Date filter reset');
}

// Open details modal
function openDetailsModal(batchData) {
    console.log('Opening details modal for batch:', batchData.batch_name);
    
    document.getElementById('details-batch-name').value = batchData.batch_name || '-';
    document.getElementById('details-upload-date').value = batchData.upload_date || '-';
    document.getElementById('details-total-rows').value = batchData.total_rows || 0;
    document.getElementById('details-total-amount').value = `৳ ${parseFloat(batchData.total_amount || 0).toFixed(2)}`;
    document.getElementById('details-disbursed-amount').value = `৳ ${parseFloat(batchData.disbursed_amount || 0).toFixed(2)}`;
    document.getElementById('details-status').value = batchData.status || 'Pending';
    
    document.getElementById('details-modal').style.display = 'flex';
}

// Close details modal
function closeDetailsModal() {
    document.getElementById('details-modal').style.display = 'none';
}

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in
    const userId = getUserId();
    const username = localStorage.getItem('username');
    const userRole = localStorage.getItem('userRole');
    
    if (!userId || !username) {
        window.location.href = 'login.html';
        return;
    }
    
    // Setup profile display
    setupProfileDisplay(username, userRole);
    
    // Fetch batch uploads
    await fetchBatchUploads();
    renderUploadHistoryTable(uploadHistoryData);
    
    // Items per page dropdown
    const itemsPerPageSelect = document.getElementById('items-per-page');
    if (itemsPerPageSelect) {
        itemsPerPageSelect.value = itemsPerPage;
        itemsPerPageSelect.addEventListener('change', (e) => {
            itemsPerPage = parseInt(e.target.value);
            currentPage = 1;
            applyUploadHistoryFilters();
        });
    }
    
    // Search functionality
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keyup', () => {
            currentPage = 1;
            applyUploadHistoryFilters();
        });
    }
    
    // Date filter functionality
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    
    if (startDateInput && endDateInput) {
        startDateInput.addEventListener('change', () => {
            currentPage = 1;
            applyUploadHistoryFilters();
        });
        
        endDateInput.addEventListener('change', () => {
            currentPage = 1;
            applyUploadHistoryFilters();
        });
    }
});
