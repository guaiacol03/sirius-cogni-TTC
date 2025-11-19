#!/usr/bin/python3
import os
from urllib.parse import parse_qs
import json
from datetime import datetime

# Get query parameters
qs = os.environ.get('QUERY_STRING', '')
qd = parse_qs(qs)

# Get base parameter or use default
base_name = qd.get('base', ['untitled'])[0]

# Get current timestamp
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

# Create base filename
filename = f"{base_name}_{timestamp}"

# Check if Saves directory exists, create if not
saves_dir = "Saves"
if not os.path.exists(saves_dir):
    os.makedirs(saves_dir)

# Find unique filename
counter = 0
unique_filename = filename
while os.path.exists(os.path.join(saves_dir, f"{unique_filename}.json")):
    counter += 1
    unique_filename = f"{filename}_{counter}"

# Add json extension
result_filename = f"{unique_filename}.json"

print("Content-Type: text/plain\n")
print(result_filename)