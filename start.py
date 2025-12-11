#!/usr/bin/env python
"""
Complete startup script for the Government Disbursement Portal
Starts both the backend API and frontend servers
"""
import os
import subprocess
import sys
import time
import webbrowser

def start_servers():
    # Get the base directory
    base_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(base_dir, 'backend')
    frontend_dir = os.path.join(base_dir, 'frontend')
    venv_python = os.path.join(base_dir, '.venv', 'Scripts', 'python.exe')
    
    print("=" * 60)
    print("Government Disbursement Portal - Startup Script")
    print("=" * 60)
    
    # Start Backend API
    print("\n[1/2] Starting Backend API on http://127.0.0.1:8000...")
    run_api_script = os.path.join(backend_dir, 'run_api.py')
    api_process = subprocess.Popen(
        [venv_python, run_api_script],
        cwd=base_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        creationflags=subprocess.CREATE_NEW_CONSOLE if sys.platform == 'win32' else 0
    )
    print("✓ Backend API started (PID: {})".format(api_process.pid))
    
    # Wait for API to start
    time.sleep(3)
    
    # Start Frontend Server
    print("\n[2/2] Starting Frontend Server on http://localhost:3000...")
    frontend_process = subprocess.Popen(
        [venv_python, '-m', 'http.server', '3000'],
        cwd=frontend_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        creationflags=subprocess.CREATE_NEW_CONSOLE if sys.platform == 'win32' else 0
    )
    print("✓ Frontend Server started (PID: {})".format(frontend_process.pid))
    
    print("\n" + "=" * 60)
    print("✓ All services are running!")
    print("=" * 60)
    print("\nAccess the application at: http://localhost:3000")
    print("API Documentation at: http://127.0.0.1:8000/docs")
    print("\nPress Ctrl+C to stop the servers...")
    print("=" * 60 + "\n")
    
    # Keep script running
    try:
        api_process.wait()
        frontend_process.wait()
    except KeyboardInterrupt:
        print("\n\nShutting down servers...")
        api_process.terminate()
        frontend_process.terminate()
        print("✓ All servers stopped.")

if __name__ == "__main__":
    start_servers()
