#!/usr/bin/env python
"""
Script to load sample data from CSV file into the database
"""

import csv
from pathlib import Path
from database import Session
from dbmodel import Product

def load_sample_data():
    """Load sample data from CSV file"""
    csv_file = Path(__file__).parent.parent / "frontend" / "sample_data.csv"
    
    print(f"[LOAD_DATA] Loading sample data from: {csv_file}")
    
    if not csv_file.exists():
        print(f"[LOAD_DATA] ERROR: File not found: {csv_file}")
        return False
    
    db = Session()
    try:
        success_count = 0
        error_count = 0
        
        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            for row_num, row in enumerate(reader, start=2):  # Start at 2 (row 1 is header)
                try:
                    # Check if product already exists
                    existing = db.query(Product).filter(
                        Product.EFTREFNUMBER == row.get('EFTREFNUMBER')
                    ).first()
                    
                    if existing:
                        print(f"[LOAD_DATA] Row {row_num}: Product already exists, skipping")
                        continue
                    
                    product = Product(
                        EFTREFNUMBER=row.get('EFTREFNUMBER'),
                        CRACCOUNTTITLE=row.get('CRACCOUNTTITLE'),
                        CRACCOUNTTYPE=row.get('CRACCOUNTTYPE'),
                        CRACCOUNTNO=row.get('CRACCOUNTNO'),
                        CRROUTINGNO=row.get('CRROUTINGNO'),
                        CRAMOUNT=float(row.get('CRAMOUNT', 0)),
                        BENEFICIARY_ID=row.get('BENEFICIARY_ID'),
                        MOBILE=row.get('MOBILE'),
                        NID_NO=row.get('NID_NO'),
                        MIN_CODE=row.get('MIN_CODE'),
                        DEPT_CODE=row.get('DEPT_CODE'),
                        PAYMENT_CYCLE_NAME_EN=row.get('PAYMENT_CYCLE_NAME_EN'),
                        SCHEME_CODE=row.get('SCHEME_CODE')
                    )
                    db.add(product)
                    db.commit()
                    success_count += 1
                    print(f"[LOAD_DATA] Row {row_num}: Successfully loaded {row.get('EFTREFNUMBER')}")
                    
                except Exception as e:
                    db.rollback()
                    error_count += 1
                    print(f"[LOAD_DATA] Row {row_num}: Error - {str(e)}")
        
        print(f"[LOAD_DATA] ✓ Completed: {success_count} products loaded, {error_count} errors")
        return True
        
    except Exception as e:
        print(f"[LOAD_DATA] ERROR: {str(e)}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = load_sample_data()
    exit(0 if success else 1)
