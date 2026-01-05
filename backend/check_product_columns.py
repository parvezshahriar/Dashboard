from sqlalchemy import inspect
from database import engine

inspector = inspect(engine)
columns = inspector.get_columns('product_1')
print('Columns in product_1 table:')
for col in columns:
    print(f'  - {col["name"]}')
