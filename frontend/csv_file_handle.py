{% extends 'base.html' %}
{% load static %}

{% block title %}Upload CSV - Government Disbursement Portal{% endblock %}

{% block extra_css %}
    <link rel="stylesheet" href="{% static 'css/upload.css' %}">
{% endblock %}

{% block content %}
<div class="upload-container">
    <h2>Upload CSV File</h2>
    <p class="subtitle">Upload a CSV file to import products in bulk</p>

    <div class="upload-section">
        <div class="upload-box" id="upload-box">
            <i class="fa-solid fa-cloud-arrow-up"></i>
            <h3>Drag and drop your CSV file here</h3>
            <p>or</p>
            <button type="button" class="btn-upload" onclick="document.getElementById('csv-file-input').click()">
                Select File
            </button>
            <input type="file" id="csv-file-input" accept=".csv" style="display:none;">
        </div>

        {% if messages %}
        <div class="messages">
            {% for message in messages %}
                <div class="alert alert-{{ message.tags }}">
                    {{ message }}
                </div>
            {% endfor %}
        </div>
        {% endif %}

        <div id="upload-result" style="display:none;">
            <h3>Upload Results</h3>
            <div id="result-content"></div>
        </div>
    </div>

    <div class="instructions">
        <h3>CSV Format Instructions</h3>
        <p>Your CSV file should contain the following columns (in order):</p>
        <ul>
            <li><strong>EFTREFNUMBER</strong> - EFT Reference Number (Required)</li>
            <li><strong>CRACCOUNTTITLE</strong> - Account Title (Required)</li>
            <li><strong>CRACCOUNTTYPE</strong> - Account Type (Required)</li>
            <li><strong>CRACCOUNTNO</strong> - Account Number (Required)</li>
            <li><strong>CRROUTINGNO</strong> - Routing Number (Required)</li>
            <li><strong>CRAMOUNT</strong> - Amount (Required, numeric)</li>
            <li><strong>BENEFICIARY_ID</strong> - Beneficiary ID (Required)</li>
            <li><strong>MOBILE</strong> - Mobile Number (Required)</li>
            <li><strong>NID_NO</strong> - NID Number (Optional)</li>
            <li><strong>MIN_CODE</strong> - Ministry Code (Optional)</li>
            <li><strong>DEPT_CODE</strong> - Department Code (Optional)</li>
            <li><strong>PAYMENT_CYCLE_NAME_EN</strong> - Payment Cycle (Optional)</li>
            <li><strong>SCHEME_CODE</strong> - Scheme Code (Optional)</li>
        </ul>

        <h4>Example CSV:</h4>
        <pre>EFTREFNUMBER,CRACCOUNTTITLE,CRACCOUNTTYPE,CRACCOUNTNO,CRROUTINGNO,CRAMOUNT,BENEFICIARY_ID,MOBILE,NID_NO
REF001,John Doe,Savings,1234567890,100,50000,BID001,01712345678,1234567890123456</pre>
    </div>
</div>

<style>
    .upload-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 30px 20px;
    }

    .upload-container h2 {
        color: #333;
        margin-bottom: 10px;
    }

    .subtitle {
        color: #666;
        margin-bottom: 30px;
    }

    .upload-section {
        background: white;
        border-radius: 5px;
        padding: 30px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        margin-bottom: 30px;
    }

    .upload-box {
        border: 2px dashed #667eea;
        border-radius: 8px;
        padding: 40px;
        text-align: center;
        background: #f9f9f9;
        cursor: pointer;
        transition: background 0.2s;
    }

    .upload-box:hover {
        background: #f0f0f0;
    }

    .upload-box i {
        font-size: 48px;
        color: #667eea;
        margin-bottom: 15px;
    }

    .upload-box h3 {
        color: #333;
        margin: 15px 0;
    }

    .upload-box p {
        color: #666;
        margin: 10px 0;
    }

    .btn-upload {
        padding: 10px 30px;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 600;
        font-size: 14px;
    }

    .btn-upload:hover {
        background: #5567d8;
    }

    .messages {
        margin-top: 20px;
    }

    .alert {
        padding: 15px;
        border-radius: 4px;
        margin-bottom: 10px;
    }

    .alert-success {
        background: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
    }

    .alert-error {
        background: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
    }

    #upload-result {
        margin-top: 20px;
        padding: 20px;
        background: #f9f9f9;
        border-radius: 4px;
    }

    #result-content {
        background: white;
        padding: 15px;
        border-radius: 4px;
    }

    .instructions {
        background: white;
        border-radius: 5px;
        padding: 20px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .instructions h3 {
        color: #333;
        margin-top: 0;
    }

    .instructions ul {
        color: #666;
        line-height: 1.8;
    }

    .instructions pre {
        background: #f5f5f5;
        padding: 15px;
        border-radius: 4px;
        overflow-x: auto;
        font-size: 12px;
    }
</style>

<script>
const uploadBox = document.getElementById('upload-box');
const csvFileInput = document.getElementById('csv-file-input');

// Drag and drop
uploadBox.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadBox.style.background = '#e8f0ff';
});

uploadBox.addEventListener('dragleave', () => {
    uploadBox.style.background = '#f9f9f9';
});

uploadBox.addEventListener('drop', (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        csvFileInput.files = files;
        handleFileUpload(files[0]);
    }
});

csvFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFileUpload(e.target.files[0]);
    }
});

function handleFileUpload(file) {
    if (!file.name.endsWith('.csv')) {
        alert('Please select a CSV file');
        return;
    }

    // Check file type
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        alert('✗ Invalid file type!\nPlease upload a CSV file (.csv)');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const csv = e.target.result;
            const lines = csv.trim().split('\n');
            
            if (lines.length < 1) {
                alert('✗ CSV file is empty');
                return;
            }
            
            // Parse CSV headers
            const headers = lines[0].split(',').map(h => h.trim());
            const requiredColumns = ['EFTREFNUMBER', 'CRACCOUNTTITLE', 'CRACCOUNTTYPE', 'CRACCOUNTNO', 'CRROUTINGNO', 'CRAMOUNT', 'BENEFICIARY_ID', 'MOBILE'];
            
            // Check if required columns exist (case-insensitive)
            const headersLower = headers.map(h => h.toLowerCase());
            const requiredLower = requiredColumns.map(c => c.toLowerCase());
            const missingColumns = requiredLower.filter(col => !headersLower.includes(col));
            
            if (missingColumns.length > 0) {
                alert(`✗ Missing required columns: ${missingColumns.join(', ')}`);
                return;
            }
            
            // Get column indices
            const refIdx = headersLower.indexOf('eftrefnumber');
            const titleIdx = headersLower.indexOf('craccounttitle');
            const typeIdx = headersLower.indexOf('craccounttype');
            const noIdx = headersLower.indexOf('craccountno');
            const routeIdx = headersLower.indexOf('crroutingno');
            const amountIdx = headersLower.indexOf('cramount');
            const benIdx = headersLower.indexOf('beneficiary_id');
            const mobileIdx = headersLower.indexOf('mobile');
            const nidIdx = headersLower.indexOf('nid_no') > -1 ? headersLower.indexOf('nid_no') : -1;
            const minIdx = headersLower.indexOf('min_code') > -1 ? headersLower.indexOf('min_code') : -1;
            const deptIdx = headersLower.indexOf('dept_code') > -1 ? headersLower.indexOf('dept_code') : -1;
            const cycleIdx = headersLower.indexOf('payment_cycle_name_en') > -1 ? headersLower.indexOf('payment_cycle_name_en') : -1;
            const schemeIdx = headersLower.indexOf('scheme_code') > -1 ? headersLower.indexOf('scheme_code') : -1;
            
            // Validate rows
            let totalRows = 0;
            let validRows = [];
            let invalidRows = [];
            let allRowsWithValidation = [];
            
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                totalRows++;
                const cols = line.split(',').map(c => c.trim());
                
                const ref = cols[refIdx] || '';
                const title = cols[titleIdx] || '';
                const type = cols[typeIdx] || '';
                const no = cols[noIdx] || '';
                const route = cols[routeIdx] || '';
                const amount = cols[amountIdx] || '';
                const ben = cols[benIdx] || '';
                const mobile = cols[mobileIdx] || '';
                const nid = nidIdx > -1 ? (cols[nidIdx] || '') : '';
                const min = minIdx > -1 ? (cols[minIdx] || '') : '';
                const dept = deptIdx > -1 ? (cols[deptIdx] || '') : '';
                const cycle = cycleIdx > -1 ? (cols[cycleIdx] || '') : '';
                const scheme = schemeIdx > -1 ? (cols[schemeIdx] || '') : '';
                
                // Validate data
                let isValid = true;
                let error = '';
                
                if (!ref) {
                    isValid = false;
                    error = 'Missing EFT Reference Number';
                } else if (!title) {
                    isValid = false;
                    error = 'Missing Account Title';
                } else if (!type) {
                    isValid = false;
                    error = 'Missing Account Type';
                } else if (!no) {
                    isValid = false;
                    error = 'Missing Account Number';
                } else if (!amount) {
                    isValid = false;
                    error = 'Missing Amount';
                } else if (isNaN(parseFloat(amount))) {
                    isValid = false;
                    error = 'Invalid amount (must be numeric)';
                } else if (parseFloat(amount) <= 0) {
                    isValid = false;
                    error = 'Amount must be greater than 0';
                } else if (!ben) {
                    isValid = false;
                    error = 'Missing Beneficiary ID';
                } else if (!mobile) {
                    isValid = false;
                    error = 'Missing Mobile Number';
                }
                
                if (isValid) {
                    validRows.push({
                        EFTREFNUMBER: ref,
                        CRACCOUNTTITLE: title,
                        CRACCOUNTTYPE: type,
                        CRACCOUNTNO: no,
                        CRROUTINGNO: route,
                        CRAMOUNT: parseFloat(amount),
                        BENEFICIARY_ID: ben,
                        MOBILE: mobile,
                        NID_NO: nid,
                        MIN_CODE: min,
                        DEPT_CODE: dept,
                        PAYMENT_CYCLE_NAME_EN: cycle,
                        SCHEME_CODE: scheme
                    });
                    allRowsWithValidation.push({
                        rowNumber: i,
                        data: cols,
                        error: 'Valid'
                    });
                } else {
                    invalidRows.push({
                        row: i,
                        reason: error
                    });
                    allRowsWithValidation.push({
                        rowNumber: i,
                        data: cols,
                        error: error
                    });
                }
            }
            
            // Show validation report modal
            showValidationReport(file.name, totalRows, validRows, invalidRows, allRowsWithValidation, headers);
            
        } catch (error) {
            console.error('Validation error:', error);
            alert('✗ Error validating CSV file: ' + error.message);
        }
    };
    
    reader.readAsText(file);
}

// Show validation report modal
function showValidationReport(fileName, totalRows, validRows, invalidRows, allRowsWithValidation, headers) {
    const validCount = validRows.length;
    const invalidCount = invalidRows.length;
    
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
    
    // Create CSV content with ID + original headers + validation columns
    const csvHeaders = ['Row ID', ...headers, 'Validation Status', 'Reason'];
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
}

// Process valid rows and post to database
async function processValidRows(validRows) {
    try {
        const resultDiv = document.getElementById('upload-result');
        const resultContent = document.getElementById('result-content');

        resultContent.innerHTML = '<p><i class="fa-solid fa-spinner fa-spin"></i> Processing...</p>';
        resultDiv.style.display = 'block';

        const response = await fetch('/api/upload-csv/?user_id={{ user.id }}', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': '{{ csrf_token }}'
            },
            body: JSON.stringify({
                rows: validRows
            })
        });
        
        const result = await response.json();
        
        // Remove modal
        const modal = document.getElementById('validation-modal');
        if (modal) modal.remove();
        
        if (response.ok && result.totalValid > 0) {
            resultContent.innerHTML = `
                <p style="color: #27ae60; font-size: 18px; margin: 0;">
                    <i class="fa-solid fa-check-circle"></i> Successfully imported ${result.totalValid} products
                </p>
                ${result.totalInvalid > 0 ? `<p style="color: #e74c3c;">⚠️ ${result.totalInvalid} rows had errors</p>` : ''}
            `;
            // Clear file input
            document.getElementById('csv-file-input').value = '';
        } else {
            resultContent.innerHTML = `
                <p style="color: #e74c3c;">❌ ${result.error || 'No valid rows found in CSV'}</p>
            `;
        }
    } catch (e) {
        resultContent.innerHTML = `<p style="color: #e74c3c;">Error: ${e.message}</p>`;
    }
}
</script>
{% endblock %}
