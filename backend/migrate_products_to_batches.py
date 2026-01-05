#!/usr/bin/env python
"""
Script to create batch upload records from existing products in product_1 table
"""

from database import Session
from dbmodel import Product, BatchUpload
from datetime import datetime

def migrate_products_to_batches():
    """Create batch upload records from existing products"""
    db = Session()
    try:
        print("[MIGRATE] Starting migration of products to batches...")
        
        # Get all products without a batch_id
        products_without_batch = db.query(Product).filter(
            Product.batch_id == None
        ).all()
        
        print(f"[MIGRATE] Found {len(products_without_batch)} products without batch_id")
        
        if len(products_without_batch) == 0:
            print("[MIGRATE] No products to migrate")
            return True
        
        # Create a single batch for all existing products
        batch_name = f"Initial_Load_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Calculate totals
        total_amount = sum(p.CRAMOUNT for p in products_without_batch if p.CRAMOUNT)
        total_rows = len(products_without_batch)
        
        # Create batch record
        db_batch = BatchUpload(
            user_id=1,  # Default to admin user
            batch_name=batch_name,
            upload_date=datetime.now(),
            total_rows=total_rows,
            total_amount=total_amount,
            disbursed_amount=0.0,
            status='Completed'
        )
        
        db.add(db_batch)
        db.flush()  # Get the batch ID
        batch_id = db_batch.id
        
        print(f"[MIGRATE] Created batch: {batch_name} (ID: {batch_id})")
        
        # Update all products with batch_id
        for product in products_without_batch:
            product.batch_id = batch_id
            db.add(product)
        
        db.commit()
        
        print(f"[MIGRATE] ✓ Successfully linked {total_rows} products to batch {batch_id}")
        print(f"[MIGRATE] Total amount in batch: ৳{total_amount}")
        
        return True
        
    except Exception as e:
        print(f"[MIGRATE] ERROR: {str(e)}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = migrate_products_to_batches()
    exit(0 if success else 1)
