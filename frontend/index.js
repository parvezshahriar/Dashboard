// 1. Fetch Data Source from API
let tableData = [];
let currentPage = 1;
let itemsPerPage = 10;

async function fetchProductsFromDatabase() {
    try {
        const response = await fetch('http://127.0.0.1:8000/product');
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        const products = await response.json();
        
        // Add status to each product
        tableData = products.map(product => ({
            ...product,
            status: Math.random() > 0.5 ? 'Approved' : 'In Progress'
        }));
        
        console.log('Products loaded:', tableData);
        currentPage = 1; // Reset to first page
        return tableData;
    } catch (error) {
        console.error('Error fetching products:', error);
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
        
        // Format timestamp
        const formatDate = (timestamp) => {
            if (!timestamp) return '-';
            const date = new Date(timestamp);
            return date.toLocaleDateString('en-GB') + ' ' + date.toLocaleTimeString('en-GB');
        };

        const tr = document.createElement('tr');
        
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
                <i class="fa-regular fa-pen-to-square" title="Edit" onclick="openEditModal(${row.id}, '${row.name.replace(/'/g, "\\'")}', '${(row.description || '').replace(/'/g, "\\'")}', ${row.price})" style="cursor:pointer;"></i>
                <i class="fa-regular fa-trash-can" title="Delete" onclick="deleteProduct(${row.id})" style="cursor:pointer;"></i>
                <i class="fa-solid fa-download" title="Download"></i>
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
            renderTable(tableData);
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
            renderTable(tableData);
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
            renderTable(tableData);
        }
    };
    paginationContainer.appendChild(nextBtn);
}

// 4. Initialize
document.addEventListener('DOMContentLoaded', async () => {
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
        // Validate file type
        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            alert('✗ Invalid file type!\nPlease upload a CSV file (.csv)');
            return;
        }
        
        // Validate CSV structure
        const isValid = await validateCSVStructure(file);
        if (!isValid) {
            return; // Validation error message already shown
        }
        
        const formData = new FormData();
        formData.append('file', file);
        
        console.log('Uploading CSV file:', file.name);
        
        const response = await fetch('http://127.0.0.1:8000/csv-upload', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        console.log('Upload result:', result);
        
        if (response.ok) {
            alert(`✓ Upload successful!\n${result.success_count} products imported\n${result.error_count} errors`);
            // Clear file input
            document.getElementById('csv-file-input').value = '';
            // Refresh the table data
            await fetchProductsFromDatabase();
            applyFilters();
        } else {
            alert(`✗ Upload failed:\n${result.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error uploading CSV file:', error);
        alert('Error uploading file. Please check the console for details.');
    }
}

// 6. Validate CSV Structure
async function validateCSVStructure(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const csv = e.target.result;
                const lines = csv.trim().split('\n');
                
                if (lines.length < 2) {
                    alert('✗ Invalid CSV!\nFile must contain at least a header row and one data row');
                    resolve(false);
                    return;
                }
                
                // Parse header row
                const headerLine = lines[0].trim();
                const headers = headerLine.split(',').map(h => h.trim().toLowerCase());
                
                // Required columns
                const requiredColumns = ['id', 'name', 'description', 'price'];
                
                // Validate column count
                if (headers.length !== requiredColumns.length) {
                    alert(`✗ Invalid column count!\nExpected ${requiredColumns.length} columns, found ${headers.length}\nRequired columns: ${requiredColumns.join(', ')}`);
                    resolve(false);
                    return;
                }
                
                // Validate column names
                const missingColumns = [];
                requiredColumns.forEach(col => {
                    if (!headers.includes(col)) {
                        missingColumns.push(col);
                    }
                });
                
                if (missingColumns.length > 0) {
                    alert(`✗ Missing required columns!\nMissing: ${missingColumns.join(', ')}\nRequired columns: ${requiredColumns.join(', ')}`);
                    resolve(false);
                    return;
                }
                
                // Validate data rows (sample check)
                let validRows = 0;
                for (let i = 1; i < Math.min(lines.length, 6); i++) {
                    const row = lines[i].trim();
                    if (row) {
                        const cols = row.split(',');
                        if (cols.length === requiredColumns.length) {
                            validRows++;
                        }
                    }
                }
                
                if (validRows === 0) {
                    alert('✗ No valid data rows found!\nEnsure data rows match the header format');
                    resolve(false);
                    return;
                }
                
                // All validations passed
                console.log('✓ CSV validation passed');
                resolve(true);
            } catch (error) {
                console.error('CSV parsing error:', error);
                alert('✗ Error reading CSV file:\n' + error.message);
                resolve(false);
            }
        };
        
        reader.onerror = () => {
            alert('✗ Error reading file');
            resolve(false);
        };
        
        reader.readAsText(file);
    });
}

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
    
    // Apply date filter (only if dates are set)
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    
    if (startDateInput && endDateInput && startDateInput.value && endDateInput.value) {
        const startDate = new Date(startDateInput.value);
        const endDate = new Date(endDateInput.value);
        
        // Set end date to end of day
        endDate.setHours(23, 59, 59, 999);
        
        filteredData = filteredData.filter(product => {
            if (!product.created_at) return false;
            
            const productDate = new Date(product.created_at);
            return productDate >= startDate && productDate <= endDate;
        });
    }
    
    renderTable(filteredData);
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
        alert('✗ Please fill in all required fields (Name and Price)');
        return;
    }
    
    if (isNaN(parseFloat(price)) || parseFloat(price) < 0) {
        alert('✗ Invalid price value');
        return;
    }
    
    try {
        console.log('Saving product:', { id, name, description, price });
        
        const response = await fetch(`http://127.0.0.1:8000/product/${id}`, {
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
            alert(`✓ Product updated successfully!`);
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
            alert(`✗ Update failed:\n${result.detail || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error updating product:', error);
        alert('✗ Error updating product. Please check the console for details.');
    }
}

// 9. Delete Product
async function deleteProduct(id) {
    // Confirm deletion
    if (!confirm(`⚠️ Are you sure you want to delete product #${id}? This action cannot be undone.`)) {
        return;
    }
    
    try {
        console.log('Deleting product:', id);
        
        const response = await fetch(`http://127.0.0.1:8000/product/${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        console.log('Delete response:', result);
        
        if (response.ok) {
            alert(`✓ Product deleted successfully!`);
            // Refresh table and maintain filters
            await fetchProductsFromDatabase();
            applyFilters();
        } else {
            alert(`✗ Delete failed:\n${result.detail || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('✗ Error deleting product. Please check the console for details.');
    }
}

// 10. Store current page before refreshing
function refreshTableKeepPage() {
    applyFilters();
}