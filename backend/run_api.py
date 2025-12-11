#!/usr/bin/env python
"""
Wrapper script to run uvicorn from the correct directory
"""
import os
import sys

# Ensure we're in the backend directory
backend_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(backend_dir)
sys.path.insert(0, backend_dir)

# Run uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("jwt:app", host="127.0.0.1", port=8000, reload=False)
