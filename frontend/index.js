// 1. Fetch Data Source from API
let tableData = [];
let currentPage = 1;
let itemsPerPage = 10;

// Logout function
function handleLogout() {
    // Clear localStorage
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    
    console.log('[LOGOUT] User logged out');
    
    // Redirect to login page
    window.location.href = 'login.html';
}

// RBAC Helper - Check user role
function getUserRole() {
    return localStorage.getItem('userRole') || 'guest';
}

function getUserId() {
    return localStorage.getItem('userId') || null;
}

function hasPermission(requiredPermission) {
    const role = getUserRole();
    const permissions = {
        'admin': ['view', 'create', 'edit', 'delete', 'csv'],
        'manager': ['view', 'edit', 'csv'],
        'user': ['view'],
        'guest': []
    };
    
    return permissions[role] && permissions[role].includes(requiredPermission);
}

// RBAC - Update UI based on user role
function updateUIBasedOnRole() {
    const userRole = getUserRole();
    const userId = getUserId();
    
    console.log('[RBAC] User role:', userRole, 'User ID:', userId);
    
    // Hide/Show features based on role
    if (userRole === 'admin') {
        // Admin sees everything
        document.querySelectorAll('[data-permission="create"]').forEach(el => el.style.display = 'block');
        document.querySelectorAll('[data-permission="edit"]').forEach(el => el.style.display = 'inline');
        document.querySelectorAll('[data-permission="delete"]').forEach(el => el.style.display = 'inline');
        document.querySelectorAll('[data-permission="csv"]').forEach(el => el.style.display = 'block');
        // Show all action buttons for admin
        document.querySelectorAll('.action-edit').forEach(el => el.style.display = 'inline');
        document.querySelectorAll('.action-delete').forEach(el => el.style.display = 'inline');
        document.querySelectorAll('.action-download').forEach(el => el.style.display = 'inline');
    } else if (userRole === 'manager') {
        // Manager sees edit and CSV
        document.querySelectorAll('[data-permission="create"]').forEach(el => el.style.display = 'none');
        document.querySelectorAll('[data-permission="edit"]').forEach(el => el.style.display = 'inline');
        document.querySelectorAll('[data-permission="delete"]').forEach(el => el.style.display = 'none');
        document.querySelectorAll('[data-permission="csv"]').forEach(el => el.style.display = 'block');
        // Show edit button only for manager
        document.querySelectorAll('.action-edit').forEach(el => el.style.display = 'inline');
        document.querySelectorAll('.action-delete').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.action-download').forEach(el => el.style.display = 'none');
    } else if (userRole === 'user') {
        // User sees only view
        document.querySelectorAll('[data-permission="create"]').forEach(el => el.style.display = 'none');
        document.querySelectorAll('[data-permission="edit"]').forEach(el => el.style.display = 'none');
        document.querySelectorAll('[data-permission="delete"]').forEach(el => el.style.display = 'none');
        document.querySelectorAll('[data-permission="csv"]').forEach(el => el.style.display = 'none');
        // Hide all action buttons for user (view-only)
        document.querySelectorAll('.action-edit').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.action-delete').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.action-download').forEach(el => el.style.display = 'none');
    }
}

async function fetchProductsFromDatabase() {
    try {
        const userId = getUserId();
        const url = userId ? `http://127.0.0.1:8000/product?user_id=${userId}` : 'http://127.0.0.1:8000/product';
        
        console.log('[FETCH] Starting fetch from', url);
        const response = await fetch(url);
        console.log('[FETCH] Response status:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        const products = await response.json();
        console.log('[FETCH] Received products:', products);
        
        // Add status to each product
        tableData = products.map(product => ({
            ...product,
            status: Math.random() > 0.5 ? 'Approved' : 'In Progress'
        }));
        
        console.log('[FETCH] Processed tableData:', tableData);
        currentPage = 1; // Reset to first page
        return tableData;
    } catch (error) {
        console.error('[FETCH] Error fetching products:', error);
        alert('Failed to load products from database. Check browser console.');
        // Fallback to empty array if API fails
        return [];
    }
}

// 2. Helper function to determine badge class
function getStatusClass(status) {
    const lower = status.toLowerCase();
    if (lower.includes('progress')) return 'in-progress';
    if (lower.includes('approved')) return 'in-progress';
    if (lower.includes('rejected')) return 'in-progress';
    if (lower.includes('cancel')) return 'in-progress';
    return '';
}

// 3. Render Function
function renderTable(data) {
    const tableBody = document.getElementById('table-body');
    tableBody.innerHTML = ''; // Clear existing

    // Calculate pagination
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = data.slice(startIndex, endIndex);

    pageData.forEach(row => {
        // Format Currency with BDT symbol (৳)
        const formatMoney = (amount) => amount ? `৳ ${parseFloat(amount).toFixed(2)}` : '';
        
        // Format timestamp (backend already formats it in BD timezone)
        const formatDate = (timestamp) => {
            if (!timestamp) return '-';
            // Backend already sends formatted string in DD/MM/YYYY HH:MM:SS format
            // Just return it as-is
            return timestamp;
        };

        const tr = document.createElement('tr');
        
        // Get user role to determine button visibility
        const userRole = getUserRole();
        let editDisplay = 'none';
        let deleteDisplay = 'none';
        let downloadDisplay = 'none';
        
        if (userRole === 'admin') {
            editDisplay = 'inline';
            deleteDisplay = 'inline';
            downloadDisplay = 'inline';
        } else if (userRole === 'manager') {
            editDisplay = 'inline';
            deleteDisplay = 'none';
            downloadDisplay = 'none';
        } else if (userRole === 'user') {
            editDisplay = 'none';
            deleteDisplay = 'none';
            downloadDisplay = 'none';
        }
        
        tr.innerHTML = `
            <td>${row.id}</td>
            <td>${row.name}</td>
            <td>${row.description}</td>
            <td style="font-weight:bold;">${formatMoney(row.price)}</td>
            <td>${formatDate(row.created_at)}</td>
            <td>
                <span class="status ${getStatusClass(row.status)}">
                    ${row.status}
                </span>
            </td>
            <td class="actions">
                <i class="fa-regular fa-pen-to-square action-edit" title="Edit" onclick="openEditModal(${row.id}, '${row.name.replace(/'/g, "\\'")}', '${(row.description || '').replace(/'/g, "\\'")}', ${row.price})" style="cursor:pointer; display:${editDisplay};"></i>
                <i class="fa-regular fa-trash-can action-delete" title="Delete" onclick="deleteProduct(${row.id})" style="cursor:pointer; display:${deleteDisplay};"></i>
                <i class="fa-solid fa-download action-download" title="Download" style="display:${downloadDisplay};"></i>
            </td>
        `;

        tableBody.appendChild(tr);
    });

    // Update pagination controls
    updatePaginationControls(totalPages);
}

// 3b. Update pagination controls
function updatePaginationControls(totalPages) {
    const paginationContainer = document.querySelector('.pagination');
    if (!paginationContainer) return;

    // Clear existing pagination
    paginationContainer.innerHTML = '';

    // Previous button
    const prevBtn = document.createElement('span');
    prevBtn.textContent = 'Previous';
    prevBtn.style.cursor = currentPage > 1 ? 'pointer' : 'not-allowed';
    prevBtn.style.color = currentPage > 1 ? '#666' : '#ccc';
    prevBtn.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            applyFilters();
        }
    };
    paginationContainer.appendChild(prevBtn);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        const pageNum = document.createElement('span');
        pageNum.className = 'page-num' + (i === currentPage ? ' active' : '');
        pageNum.textContent = i;
        pageNum.style.cursor = 'pointer';
        pageNum.onclick = () => {
            currentPage = i;
            applyFilters();
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
            applyFilters();
        }
    };
    paginationContainer.appendChild(nextBtn);
}

// 4. Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in
    const userId = getUserId();
    const username = localStorage.getItem('username');
    
    if (!userId || !username) {
        // Redirect to login if not logged in
        window.location.href = 'login.html';
        return;
    }
    
    // Display username in header
    const usernameDisplay = document.getElementById('username-display');
    if (usernameDisplay) {
        usernameDisplay.textContent = `Welcome, ${username}`;
    }
    
    // Update UI based on user role first
    updateUIBasedOnRole();
    
    await fetchProductsFromDatabase();
    renderTable(tableData);
    
    // Items per page dropdown
    const itemsPerPageSelect = document.getElementById('items-per-page');
    if (itemsPerPageSelect) {
        itemsPerPageSelect.value = itemsPerPage;
        itemsPerPageSelect.addEventListener('change', (e) => {
            itemsPerPage = parseInt(e.target.value);
            currentPage = 1;
            applyFilters();
        });
    }
    
    // Search functionality
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keyup', () => {
            currentPage = 1;
            applyFilters();
        });
    }
    
    // Date filter functionality
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    
    if (startDateInput && endDateInput) {
        startDateInput.addEventListener('change', () => {
            currentPage = 1;
            applyFilters();
        });
        
        endDateInput.addEventListener('change', () => {
            currentPage = 1;
            applyFilters();
        });
    }
    
    // CSV File upload functionality
    const csvFileInput = document.getElementById('csv-file-input');
    if (csvFileInput) {
        csvFileInput.addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (file && file.type === 'text/csv') {
                await uploadCSVFile(file);
                // Reset file input
                csvFileInput.value = '';
            } else if (file) {
                alert('Please select a valid CSV file');
            }
        });
    }
});

// 5. Upload CSV File to Database
async function uploadCSVFile(file) {
    try {
        // Check permission
        if (!hasPermission('csv')) {
            alert('❌ You do not have permission to upload CSV files');
            return;
        }
        
        // Validate file type
        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            alert('✗ Invalid file type!\nPlease upload a CSV file (.csv)');
            return;
        }
        
        console.log('[UPLOAD] Reading file:', file.name);
        
        // Read and validate CSV
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csv = e.target.result;
                const lines = csv.trim().split('\n');
                
                if (lines.length < 1) {
                    alert('✗ CSV file is empty');
                    return;
                }
                
                // Parse CSV
                const headers = lines[0].split(',').map(h => h.trim());
                const requiredColumns = ['name', 'description', 'price'];
                
                console.log('[UPLOAD] Headers found:', headers);
                console.log('[UPLOAD] Required columns:', requiredColumns);
                
                // Check if required columns exist (case-insensitive)
                const headersLower = headers.map(h => h.toLowerCase());
                const missingColumns = requiredColumns.filter(col => !headersLower.includes(col));
                
                if (missingColumns.length > 0) {
                    alert(`✗ Missing required columns: ${missingColumns.join(', ')}\n\nRequired columns: ${requiredColumns.join(', ')}`);
                    return;
                }
                
                // Get column indices
                const nameIdx = headersLower.indexOf('name');
                const descIdx = headersLower.indexOf('description');
                const priceIdx = headersLower.indexOf('price');
                
                // Validate rows
                let totalRows = 0;
                let validRows = [];
                let invalidRows = [];
                let allRowsWithValidation = []; // Track all rows with validation status
                
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue; // Skip empty lines
                    
                    totalRows++;
                    const cols = line.split(',').map(c => c.trim());
                    
                    // Check if row has enough columns
                    if (cols.length < Math.max(nameIdx, descIdx, priceIdx) + 1) {
                        invalidRows.push({
                            row: i + 1,
                            reason: 'Not enough columns'
                        });
                        allRowsWithValidation.push({
                            rowNumber: i + 1,
                            data: cols,
                            error: 'Not enough columns'
                        });
                        continue;
                    }
                    
                    const name = cols[nameIdx];
                    const description = cols[descIdx];
                    const price = cols[priceIdx];
                    
                    // Validate data
                    let isValid = true;
                    let error = '';
                    
                    if (!name || name === '') {
                        isValid = false;
                        error = 'Missing product name';
                    } else if (!price || price === '') {
                        isValid = false;
                        error = 'Missing price';
                    } else if (isNaN(parseFloat(price))) {
                        isValid = false;
                        error = 'Invalid price (must be numeric)';
                    } else if (parseFloat(price) <= 0) {
                        isValid = false;
                        error = 'Price must be greater than 0';
                    }
                    
                    if (isValid) {
                        validRows.push({
                            name: name,
                            description: description || '',
                            price: parseFloat(price)
                        });
                        allRowsWithValidation.push({
                            rowNumber: i + 1,
                            data: cols,
                            error: 'Valid'
                        });
                    } else {
                        invalidRows.push({
                            row: i + 1,
                            reason: error
                        });
                        allRowsWithValidation.push({
                            rowNumber: i + 1,
                            data: cols,
                            error: error
                        });
                    }
                }
                
                // Show validation report modal
                showValidationReport(file.name, totalRows, validRows, invalidRows, allRowsWithValidation, headers);
                
            } catch (error) {
                console.error('[UPLOAD] Validation error:', error);
                alert('✗ Error validating CSV file: ' + error.message);
            }
        };
        
        reader.readAsText(file);
        
    } catch (error) {
        console.error('[UPLOAD] Error uploading CSV file:', error);
        alert('Error uploading file. Please check the console for details.');
    }
}

// Show validation report modal
function showValidationReport(fileName, totalRows, validRows, invalidRows, allRowsWithValidation, headers) {
    const validCount = validRows.length;
    const invalidCount = invalidRows.length;
    
    console.log('[REPORT] Validation complete:', {
        fileName,
        totalRows,
        validCount,
        invalidCount
    });
    
    // Store data globally for download function
    window.reportData = {
        fileName: fileName,
        allRowsWithValidation: allRowsWithValidation,
        headers: headers
    };
    
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'validation-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;
    
    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
    
    modal.innerHTML = `
        <div style="background: white; border-radius: 8px; padding: 30px; width: 500px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="margin: 0; font-size: 18px; color: #333;">CSV Upload Report</h2>
                <button onclick="document.getElementById('validation-modal').remove()" style="font-size: 24px; color: #999; cursor: pointer; border: none; background: none;">&times;</button>
            </div>
            
            <div style="margin-bottom: 20px;">
                <div style="font-size: 14px; color: #555; margin-bottom: 8px;">
                    <strong>Date:</strong> ${dateStr}
                </div>
                <div style="font-size: 14px; color: #555; margin-bottom: 8px;">
                    <strong>File Name:</strong> ${fileName}
                </div>
            </div>
            
            <div style="background: #f5f5f5; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                <div style="font-size: 14px; color: #333; margin-bottom: 8px;">
                    <strong>Total Rows:</strong> ${totalRows}
                </div>
                <div style="font-size: 14px; color: #27ae60; margin-bottom: 8px;">
                    <strong>✓ Successfully Processed:</strong> ${validCount}
                </div>
                <div style="font-size: 14px; color: #e74c3c; margin-bottom: 8px;">
                    <strong>✗ Failed To Process:</strong> ${invalidCount}
                </div>
            </div>
            
            <div style="display: flex; justify-content: flex-end; gap: 10px;">
                <button onclick="downloadErrorReport()" style="padding: 10px 20px; background: #1a1a1a; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Download Report</button>
                <button 
                    onclick="processValidRows(${JSON.stringify(validRows).replace(/"/g, '&quot;')})" 
                    style="padding: 10px 20px; background: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">
                    Process ${validCount} Valid Rows
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Download Error Report as CSV
function downloadErrorReport() {
    if (!window.reportData) {
        alert('Error: Report data not found. Please try uploading again.');
        return;
    }
    
    const { fileName, allRowsWithValidation, headers } = window.reportData;
    
    console.log('[DOWNLOAD] Creating error report CSV');
    
    // Create CSV content with ID + original headers + two validation columns
    const csvHeaders = ['ID', ...headers, 'Validation Status', 'Reason'];
    const csvRows = [csvHeaders.join(',')];
    
    // Add data rows with row number as ID + validation status and reason
    allRowsWithValidation.forEach(row => {
        const isValid = row.error === 'Valid';
        const status = isValid ? 'Valid' : 'Invalid';
        const reason = isValid ? '' : row.error;
        const dataRow = [row.rowNumber, ...row.data, status, reason ? `"${reason}"` : ''];
        csvRows.push(dataRow.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const baseFileName = fileName.replace('.csv', '');
    const downloadFileName = `${baseFileName}_error_report_${timestamp}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', downloadFileName);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('[DOWNLOAD] Error report downloaded:', downloadFileName);
}
async function processValidRows(validRows) {
    try {
        // Check permission
        if (!hasPermission('csv')) {
            alert('❌ You do not have permission to process CSV data');
            return;
        }
        
        console.log('[PROCESS] Processing', validRows.length, 'valid rows');
        
        const userId = getUserId();
        const response = await fetch(`http://127.0.0.1:8000/upload-batch?user_id=${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                rows: validRows,
                totalValid: validRows.length,
                totalInvalid: 0,
                timestamp: new Date().toISOString()
            })
        });
        
        const result = await response.json();
        console.log('[PROCESS] Result:', result);
        
        // Remove modal
        const modal = document.getElementById('validation-modal');
        if (modal) modal.remove();
        
        if (response.ok) {
            alert(`Successfully processed:\n${result.success_count} products imported`);
            // Clear file input
            const fileInput = document.getElementById('csv-file-input');
            if (fileInput) fileInput.value = '';
            // Refresh the table data
            await fetchProductsFromDatabase();
            applyFilters();
        } else {
            alert(`Failed to process:\n${result.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('[PROCESS] Error:', error);
        alert('Error processing rows. Please check the console.');
    }
}

// 6. Validate CSV Structure

// 5. Apply all filters together
function applyFilters() {
    let filteredData = [...tableData];
    
    // Apply search filter
    const searchInput = document.getElementById('search-input');
    if (searchInput && searchInput.value) {
        const searchTerm = searchInput.value.toLowerCase();
        filteredData = filteredData.filter(product => {
            return (
                product.id.toString().includes(searchTerm) ||
                product.name.toLowerCase().includes(searchTerm) ||
                product.description.toLowerCase().includes(searchTerm) ||
                product.price.toString().includes(searchTerm)
            );
        });
    }
    
    // Apply date filter (only if both dates are set)
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    
    if (startDateInput && endDateInput && startDateInput.value && endDateInput.value) {
        // Parse input dates (format: YYYY-MM-DD from input type="date")
        const [startYear, startMonth, startDay] = startDateInput.value.split('-').map(Number);
        const [endYear, endMonth, endDay] = endDateInput.value.split('-').map(Number);
        
        const startDate = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
        const endDate = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);
        
        console.log('[DATE FILTER] Input dates:', {
            startInput: startDateInput.value,
            endInput: endDateInput.value,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        });
        
        filteredData = filteredData.filter(product => {
            if (!product.created_at) {
                console.log('[DATE FILTER] No created_at for product:', product.id);
                return false;
            }
            
            // Parse backend formatted date: "DD/MM/YYYY HH:MM:SS"
            const dateParts = product.created_at.split(' ')[0].split('/');
            
            if (dateParts.length !== 3) {
                console.warn('[DATE FILTER] Invalid date format:', product.created_at);
                return false;
            }
            
            const day = parseInt(dateParts[0], 10);
            const month = parseInt(dateParts[1], 10);
            const year = parseInt(dateParts[2], 10);
            
            const productDate = new Date(year, month - 1, day, 0, 0, 0, 0);
            
            const isInRange = productDate >= startDate && productDate <= endDate;
            
            console.log('[DATE FILTER] Product check:', {
                id: product.id,
                original: product.created_at,
                parsed: {day, month, year},
                dateObj: productDate.toISOString(),
                inRange: isInRange
            });
            
            return isInRange;
        });
        
        console.log('[DATE FILTER] Results:', filteredData.length, 'products match date range');
    } else {
        console.log('[DATE FILTER] Skipped - missing date inputs');
    }
    
    renderTable(filteredData);
}

// Reset Date Filter Function
function resetDateFilter() {
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    
    // Clear the date inputs
    if (startDateInput) startDateInput.value = '';
    if (endDateInput) endDateInput.value = '';
    
    // Reset pagination and reapply filters
    currentPage = 1;
    applyFilters();
    console.log('[FILTER] Date filter reset');
}

// 7. Edit Modal Functions
function openEditModal(id, name, description, price) {
    console.log('Opening edit modal for product:', id);
    document.getElementById('edit-id').value = id;
    document.getElementById('edit-name').value = name;
    document.getElementById('edit-description').value = description;
    document.getElementById('edit-price').value = price;
    document.getElementById('edit-modal').style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('edit-modal').style.display = 'none';
    // Clear fields
    document.getElementById('edit-id').value = '';
    document.getElementById('edit-name').value = '';
    document.getElementById('edit-description').value = '';
    document.getElementById('edit-price').value = '';
}

// 8. Save Product Changes
async function saveProductChanges() {
    const id = document.getElementById('edit-id').value;
    const name = document.getElementById('edit-name').value;
    const description = document.getElementById('edit-description').value;
    const price = document.getElementById('edit-price').value;
    
    // Validate fields
    if (!name || !price) {
        alert('Please fill in all required fields (Name and Price)');
        return;
    }
    
    if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
        alert('Invalid price value');
        return;
    }
    
    // Check permission
    if (!hasPermission('edit')) {
        alert('❌ You do not have permission to edit products');
        return;
    }
    
    try {
        const userId = getUserId();
        console.log('Saving product:', { id, name, description, price });
        
        const response = await fetch(`http://127.0.0.1:8000/product/${id}?user_id=${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: parseInt(id),
                name: name,
                description: description,
                price: parseFloat(price)
            })
        });
        
        const result = await response.json();
        console.log('Update response:', result);
        
        if (response.ok) {
            alert(`Product updated successfully!`);
            closeEditModal();
            
            // Update the product in tableData in-place using map()
            // This preserves the product's position without reordering
            tableData = tableData.map(product => 
                product.id === parseInt(id) 
                    ? { 
                        ...product, 
                        name: name,
                        description: description,
                        price: parseFloat(price),
                        created_at: product.created_at // Keep original timestamp
                      }
                    : product
            );
            
            console.log('Updated tableData:', tableData);
            
            // Refresh the current view without resetting page
            refreshTableKeepPage();
        } else {
            alert(`Update failed:\n${result.detail || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error updating product:', error);
        alert('Error updating product. Please check the console for details.');
    }
}

// 9. Delete Product
async function deleteProduct(id) {
    // Confirm deletion
    if (!confirm(`⚠️ Are you sure you want to delete product #${id}? This action cannot be undone.`)) {
        return;
    }
    
    // Check permission
    if (!hasPermission('delete')) {
        alert('❌ You do not have permission to delete products');
        return;
    }
    
    try {
        const userId = getUserId();
        console.log('Deleting product:', id);
        
        const response = await fetch(`http://127.0.0.1:8000/product/${id}?user_id=${userId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        console.log('Delete response:', result);
        
        if (response.ok) {
            alert(`Product deleted successfully!`);
            // Refresh table and maintain filters
            await fetchProductsFromDatabase();
            applyFilters();
        } else {
            alert(`Delete failed:\n${result.detail || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product. Please check the console for details.');
    }
}

// 10. Store current page before refreshing
function refreshTableKeepPage() {
    applyFilters();
}