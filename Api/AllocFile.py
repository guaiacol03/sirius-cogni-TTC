#!/usr/bin/python3
import os

qs = os.environ.get('QUERY_STRING')
nqs = qs.split('#')[1]

print("Content-Type: text/plain")
print("Status: 200 OK")
print(nqs)