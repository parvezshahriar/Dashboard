// 1. Fetch Data Source from API
let tableData = [];
let currentPage = 1;
let itemsPerPage = 10; // Show 10 records per page

// Table and data management functions below

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
        showError('SERVER_NOT_CONNECTED', 'Failed to load products from database. Please check if the server is running.');
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
            editDisplay = 'none'; // User role cannot edit
            deleteDisplay = 'none';
            downloadDisplay = 'none';
        }
        
        tr.innerHTML = `
            <td>${row.EFTREFNUMBER}</td>
            <td>${row.CRACCOUNTTITLE}</td>
            <td>${row.CRACCOUNTTYPE}</td>
            <td>${row.CRACCOUNTNO}</td>
            <td style="font-weight:bold;">${formatMoney(row.CRAMOUNT)}</td>
            <td>${row.BENEFICIARY_ID}</td>
            <td>${row.MOBILE}</td>
            <td>
                <span class="status ${getStatusClass(row.status)}">
                    ${row.status}
                </span>
            </td>
            <td class="actions">
                <i class="fa-regular fa-pen-to-square action-edit" title="Edit" onclick="openEditModal(${JSON.stringify(row).replace(/"/g, '&quot;')})" style="cursor:pointer; display:${editDisplay};"></i>
                <i class="fa-regular fa-trash-can action-delete" title="Delete" onclick="deleteProduct('${row.EFTREFNUMBER}')" style="cursor:pointer; display:${deleteDisplay};"></i>
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

    // Handle case with no pages or no data
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
            applyFilters();
        }
    };
    paginationContainer.appendChild(prevBtn);

    // Page numbers - show max 5 pages or all if less than 5
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
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
    const userRole = localStorage.getItem('userRole');
    
    if (!userId || !username) {
        // Redirect to login if not logged in
        window.location.href = 'login.html';
        return;
    }
    
    // Setup profile display
    setupProfileDisplay(username, userRole);
    
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
    
    // CSV Drag and Drop functionality
    const uploadBox = document.getElementById('upload-box');
    if (uploadBox) {
        uploadBox.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadBox.style.background = '#e8f0ff';
            uploadBox.style.borderColor = '#667eea';
        });
        
        uploadBox.addEventListener('dragleave', () => {
            uploadBox.style.background = '#f9f9f9';
            uploadBox.style.borderColor = '#667eea';
        });
        
        uploadBox.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadBox.style.background = '#f9f9f9';
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
                    uploadCSVFile(file);
                } else {
                    alert('⚠️ Please drop a CSV file');
                }
            }
        });
    }
});

// Need debugger

// 5. Upload CSV File - Client-side validation only
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
                const { headers, rows } = parseCSVContent(csv);
                
                // Validate headers
                const requiredCols = getRequiredCSVColumns();
                const validation = validateCSVHeaders(headers, requiredCols);
                
                if (!validation.isValid) {
                    alert(`✗ Missing required columns: ${validation.missingColumns.join(', ')}`);
                    return;
                }
                
                // Validate rows
                let validRows = [];
                let invalidRows = [];
                let allRowsWithValidation = [];
                const headersLower = headers.map(h => h.toLowerCase());
                
                // Track unique fields for duplicate detection
                const uniqueFieldTracker = {
                    EFTREFNUMBER: new Set(),
                    CRACCOUNTNO: new Set(),
                    BENEFICIARY_ID: new Set(),
                    NID_NO: new Set()
                };
                
                rows.forEach((row, index) => {
                    const rowNumber = index + 2; // +2 because index 0 is header, +1 for 1-based
                    
                    // Build row data object
                    const rowData = {};
                    const requiredCols = getRequiredCSVColumns();
                    requiredCols.forEach(col => {
                        const colIndex = getColumnIndex(headersLower, col);
                        rowData[col] = colIndex >= 0 ? row[colIndex] : '';
                    });
                    
                    // Also get optional columns for duplication check
                    const optionalCols = getOptionalCSVColumns();
                    optionalCols.forEach(col => {
                        const colIndex = getColumnIndex(headersLower, col);
                        rowData[col] = colIndex >= 0 ? row[colIndex] : '';
                    });
                    
                    // Validate
                    const validation = validateRowData(rowData, uniqueFieldTracker);
                    
                    if (validation.isValid) {
                        validRows.push(rowData);
                        allRowsWithValidation.push({
                            rowNumber: rowNumber,
                            data: row,
                            error: 'Valid'
                        });
                    } else {
                        invalidRows.push({
                            row: rowNumber,
                            reason: validation.error
                        });
                        allRowsWithValidation.push({
                            rowNumber: rowNumber,
                            data: row,
                            error: validation.error
                        });
                    }
                });
                
                // Show validation report
                showValidationReport(file.name, rows.length, validRows, invalidRows, allRowsWithValidation, headers);
                
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

// Show validation report modal - Client-side only
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
        headers: headers,
        validRows: validRows
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
                <h2 style="margin: 0; font-size: 18px; color: #333;">CSV Validation Report</h2>
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
                    <strong>✓ Valid Rows:</strong> ${validCount}
                </div>
                <div style="font-size: 14px; color: #e74c3c; margin-bottom: 8px;">
                    <strong>✗ Invalid Rows:</strong> ${invalidCount}
                </div>
            </div>
            
            <div style="display: flex; justify-content: flex-end; gap: 10px;">
                <button onclick="downloadValidationReport()" style="padding: 10px 20px; background: #1a1a1a; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Download Report</button>
                <button onclick="uploadValidRowsToDatabase()" style="padding: 10px 20px; background: #27ae60; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Upload Valid Rows</button>
                <button onclick="document.getElementById('validation-modal').remove()" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">Close</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Download validation report as CSV
function downloadValidationReport() {
    if (!window.reportData) {
        alert('Error: Report data not found. Please try uploading again.');
        return;
    }
    
    const { fileName, allRowsWithValidation, headers } = window.reportData;
    
    console.log('[DOWNLOAD] Creating validation report CSV');
    
    // Create CSV content
    const csvHeaders = ['ID', ...headers, 'Validation Status', 'Reason'];
    const csvRows = [csvHeaders.join(',')];
    
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
    const downloadFileName = `${baseFileName}_validation_report_${timestamp}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', downloadFileName);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('[DOWNLOAD] Report downloaded:', downloadFileName);
}

// Upload valid rows to database
async function uploadValidRowsToDatabase() {
    if (!window.reportData || !window.reportData.validRows || window.reportData.validRows.length === 0) {
        alert('❌ No valid rows to upload');
        return;
    }

    const userId = getUserId();
    const validRows = window.reportData.validRows;
    
    // Show confirmation
    if (!confirm(`Are you sure you want to upload ${validRows.length} valid row(s) to the database?`)) {
        return;
    }

    try {
        console.log('[UPLOAD] Sending valid rows to backend:', validRows);
        
        // Show loading state
        const modal = document.getElementById('validation-modal');
        if (modal) {
            modal.style.opacity = '0.5';
        }

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
        console.log('[UPLOAD] Backend response:', result);

        // Hide modal and show result
        if (modal) {
            modal.remove();
        }

        if (response.ok) {
            // Only show error details if there are errors
            if (result.error_count > 0) {
                let errorMsg = `✅ Uploaded ${result.success_count} row(s) successfully!\n\n⚠️  ${result.error_count} error(s) encountered:\n`;
                if (result.error_details && result.error_details.length > 0) {
                    errorMsg += result.error_details.slice(0, 5).join('\n');
                    if (result.error_details.length > 5) {
                        errorMsg += `\n... and ${result.error_details.length - 5} more errors`;
                    }
                }
                alert(errorMsg);
            } else {
                // No errors - clean success message
                alert(`✅ Successfully uploaded ${result.success_count} row(s) to the database!`);
            }
            
            // Refresh the entire page after successful upload
            setTimeout(() => {
                location.reload();
            }, 1000);
        } else {
            let errorMsg = result.message || 'Unknown error';
            if (result.error_details && result.error_details.length > 0) {
                errorMsg += '\n\n' + result.error_details.slice(0, 3).join('\n');
                if (result.error_details.length > 3) {
                    errorMsg += `\n... and ${result.error_details.length - 3} more errors`;
                }
            }
            alert(`❌ Upload failed:\n${errorMsg}`);
        }
    } catch (error) {
        console.error('[UPLOAD] Error uploading rows:', error);
        const modal = document.getElementById('validation-modal');
        if (modal) {
            modal.remove();
        }
        alert('❌ Error uploading rows. Please check the console for details.\n\n' + error.message);
    }
}

// 6. Apply all filters together
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
function openEditModal(rowData) {
    console.log('Opening edit modal for transaction:', rowData.EFTREFNUMBER);
    document.getElementById('edit-EFTREFNUMBER').value = rowData.EFTREFNUMBER;
    document.getElementById('edit-CRACCOUNTTITLE').value = rowData.CRACCOUNTTITLE;
    document.getElementById('edit-CRACCOUNTTYPE').value = rowData.CRACCOUNTTYPE;
    document.getElementById('edit-CRACCOUNTNO').value = rowData.CRACCOUNTNO;
    document.getElementById('edit-CRROUTINGNO').value = rowData.CRROUTINGNO;
    document.getElementById('edit-CRAMOUNT').value = rowData.CRAMOUNT;
    document.getElementById('edit-BENEFICIARY_ID').value = rowData.BENEFICIARY_ID;
    document.getElementById('edit-MOBILE').value = rowData.MOBILE;
    document.getElementById('edit-NID_NO').value = rowData.NID_NO;
    document.getElementById('edit-MIN_CODE').value = rowData.MIN_CODE;
    document.getElementById('edit-DEPT_CODE').value = rowData.DEPT_CODE;
    document.getElementById('edit-PAYMENT_CYCLE_NAME_EN').value = rowData.PAYMENT_CYCLE_NAME_EN;
    document.getElementById('edit-SCHEME_CODE').value = rowData.SCHEME_CODE;
    document.getElementById('edit-modal').style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('edit-modal').style.display = 'none';
    // Clear all fields
    document.getElementById('edit-EFTREFNUMBER').value = '';
    document.getElementById('edit-CRACCOUNTTITLE').value = '';
    document.getElementById('edit-CRACCOUNTTYPE').value = '';
    document.getElementById('edit-CRACCOUNTNO').value = '';
    document.getElementById('edit-CRROUTINGNO').value = '';
    document.getElementById('edit-CRAMOUNT').value = '';
    document.getElementById('edit-BENEFICIARY_ID').value = '';
    document.getElementById('edit-MOBILE').value = '';
    document.getElementById('edit-NID_NO').value = '';
    document.getElementById('edit-MIN_CODE').value = '';
    document.getElementById('edit-DEPT_CODE').value = '';
    document.getElementById('edit-PAYMENT_CYCLE_NAME_EN').value = '';
    document.getElementById('edit-SCHEME_CODE').value = '';
}

// 8. Save Product Changes
async function saveProductChanges() {
    const id = document.getElementById('edit-EFTREFNUMBER').value;
    
    // Get all field values
    const updateData = {
        EFTREFNUMBER: id,
        CRACCOUNTTITLE: document.getElementById('edit-CRACCOUNTTITLE').value,
        CRACCOUNTTYPE: document.getElementById('edit-CRACCOUNTTYPE').value,
        CRACCOUNTNO: document.getElementById('edit-CRACCOUNTNO').value,
        CRROUTINGNO: document.getElementById('edit-CRROUTINGNO').value,
        CRAMOUNT: parseFloat(document.getElementById('edit-CRAMOUNT').value),
        BENEFICIARY_ID: document.getElementById('edit-BENEFICIARY_ID').value,
        MOBILE: document.getElementById('edit-MOBILE').value,
        NID_NO: document.getElementById('edit-NID_NO').value,
        MIN_CODE: document.getElementById('edit-MIN_CODE').value,
        DEPT_CODE: document.getElementById('edit-DEPT_CODE').value,
        PAYMENT_CYCLE_NAME_EN: document.getElementById('edit-PAYMENT_CYCLE_NAME_EN').value,
        SCHEME_CODE: document.getElementById('edit-SCHEME_CODE').value
    };
    
    // Validate required fields
    if (!updateData.CRACCOUNTTITLE || !updateData.CRACCOUNTNO || !updateData.CRAMOUNT) {
        alert('Please fill in all required fields');
        return;
    }
    
    if (isNaN(updateData.CRAMOUNT) || updateData.CRAMOUNT < 0) {
        alert('Invalid amount value');
        return;
    }
    
    // Check permission
    if (!hasPermission('edit')) {
        alert('❌ You do not have permission to edit transactions');
        return;
    }
    
    try {
        const userId = getUserId();
        console.log('Saving transaction with all fields:', updateData);
        
        const response = await fetch(`http://127.0.0.1:8000/product/${id}?user_id=${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        const result = await response.json();
        console.log('Update response:', result);
        
        if (response.ok) {
            alert(`Transaction updated successfully!`);
            closeEditModal();
            
            // Refresh the entire page after successful update
            setTimeout(() => {
                location.reload();
            }, 500);
        } else {
            alert(`Update failed:\n${result.detail || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error updating transaction:', error);
        alert('Error updating transaction. Please check the console for details.');
    }
}

// 9. Delete Product
async function deleteProduct(id) {
    // Confirm deletion
    if (!confirm(`⚠️ Are you sure you want to delete transaction ${id}? This action cannot be undone.`)) {
        return;
    }
    
    // Check permission
    if (!hasPermission('delete')) {
        alert('❌ You do not have permission to delete transactions');
        return;
    }
    
    try {
        const userId = getUserId();
        console.log('Deleting transaction:', id);
        
        const response = await fetch(`http://127.0.0.1:8000/product/${id}?user_id=${userId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        console.log('Delete response:', result);
        
        if (response.ok) {
            alert(`Transaction deleted successfully!`);
            // Refresh the entire page after successful delete
            setTimeout(() => {
                location.reload();
            }, 500);
        } else {
            alert(`Delete failed:\n${result.detail || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error deleting transaction:', error);
        alert('Error deleting transaction. Please check the console for details.');
    }
}

// 10. Store current page before refreshing
function refreshTableKeepPage() {
    applyFilters();
}

// CSV UTILITY HELPER FUNCTIONS

// Parse CSV content and extract headers and rows
function parseCSVContent(csv) {
    const lines = csv.trim().split('\n').filter(line => line.trim());
    if (lines.length < 1) {
        throw new Error('CSV file is empty');
    }
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const rows = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        rows.push(values);
    }
    
    return { headers, rows };
}

// Validate CSV headers against required columns
function validateCSVHeaders(headers, requiredColumns) {
    const headerSet = new Set(headers.map(h => h.toLowerCase()));
    const missingColumns = [];
    
    requiredColumns.forEach(col => {
        if (!headerSet.has(col.toLowerCase())) {
            missingColumns.push(col);
        }
    });
    
    return {
        isValid: missingColumns.length === 0,
        missingColumns: missingColumns
    };
}

// Get column index from headers array
function getColumnIndex(headers, columnName) {
    const lowerName = columnName.toLowerCase();
    return headers.findIndex(h => h.toLowerCase() === lowerName);
}

// Validate individual row data
function validateRowData(rowData, uniqueFieldTracker) {
    // Check required fields from product_1 schema
    const requiredFields = ['EFTREFNUMBER', 'CRACCOUNTTITLE', 'CRACCOUNTTYPE', 'CRACCOUNTNO', 'CRROUTINGNO', 'CRAMOUNT', 'BENEFICIARY_ID', 'MOBILE'];
    
    for (const field of requiredFields) {
        if (!rowData[field] || rowData[field].toString().trim() === '') {
            return {
                isValid: false,
                error: `Missing required field: ${field}`
            };
        }
    }
    
    // Validate CRAMOUNT is a number
    if (isNaN(parseFloat(rowData['CRAMOUNT']))) {
        return {
            isValid: false,
            error: 'CRAMOUNT must be a valid number'
        };
    }
    
    // Validate CRAMOUNT is positive
    if (parseFloat(rowData['CRAMOUNT']) <= 0) {
        return {
            isValid: false,
            error: 'CRAMOUNT must be greater than 0'
        };
    }
    
    // Validate MOBILE format (basic validation)
    if (!/^[0-9+\-\s()]+$/.test(rowData['MOBILE'])) {
        return {
            isValid: false,
            error: 'MOBILE must contain only numbers and valid phone characters'
        };
    }
    
    // Check for duplicates in unique fields (only if tracker is provided)
    if (uniqueFieldTracker) {
        const uniqueFields = ['EFTREFNUMBER', 'CRACCOUNTNO', 'BENEFICIARY_ID', 'NID_NO'];
        
        for (const field of uniqueFields) {
            const value = rowData[field];
            
            // Skip NID_NO if empty (it's optional)
            if (field === 'NID_NO' && !value) {
                continue;
            }
            
            if (value && uniqueFieldTracker[field].has(value)) {
                return {
                    isValid: false,
                    error: `Duplicate ${field}: "${value}" already exists in this batch`
                };
            }
            
            if (value) {
                uniqueFieldTracker[field].add(value);
            }
        }
    }
    
    return { isValid: true };
}

// Generate validation report object
function generateValidationReport(validRows, invalidRows, totalRows) {
    return {
        totalRows: totalRows,
        validRows: validRows.length,
        invalidRows: invalidRows.length,
        successRate: ((validRows.length / totalRows) * 100).toFixed(2),
        errors: invalidRows
    };
}

// Format file size for display
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Get required CSV columns - based on product_1 database schema
function getRequiredCSVColumns() {
    return ['EFTREFNUMBER', 'CRACCOUNTTITLE', 'CRACCOUNTTYPE', 'CRACCOUNTNO', 'CRROUTINGNO', 'CRAMOUNT', 'BENEFICIARY_ID', 'MOBILE'];
}

// Get optional CSV columns - based on product_1 database schema
function getOptionalCSVColumns() {
    return ['NID_NO', 'MIN_CODE', 'DEPT_CODE', 'PAYMENT_CYCLE_NAME_EN', 'SCHEME_CODE'];
}
