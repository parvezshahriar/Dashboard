#!/usr/bin/env python
"""Test batch uploads endpoint"""

from database import Session
from dbmodel import BatchUpload, Product

db = Session()
try:
    # Check if batch_upload table exists
    batches = db.query(BatchUpload).all()
    print(f"[TEST] Found {len(batches)} batch uploads")
    
    for batch in batches:
        products = db.query(Product).filter(Product.batch_id == batch.id).all()
        print(f"[TEST] Batch {batch.id} ({batch.batch_name}): {len(products)} products")
        
finally:
    db.close()
