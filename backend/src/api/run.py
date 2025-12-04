#!/usr/bin/env python3
"""
Simple script to run the Flask API server.
Make sure you have set up your .env file with database credentials.
"""
import os
import sys

# Add parent directory to path to import app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.app import app

if __name__ == '__main__':
    port = int(os.getenv('API_PORT', 5000))
    host = os.getenv('API_HOST', '0.0.0.0')
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    print(f"Starting Flask API server on {host}:{port}")
    print(f"Debug mode: {debug}")
    print(f"Make sure your database is configured in .env file")
    
    app.run(host=host, port=port, debug=debug)

