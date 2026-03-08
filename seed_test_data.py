import requests
import json
import sys

BASE_URL = "http://localhost:8000/api/v1"

print("Registering user...")
reg_res = requests.post(f"{BASE_URL}/auth/register", json={
    "email": "paps_tester@test.com",
    "password": "password123"
})
if reg_res.status_code not in [200, 201, 400]:
    print(f"Failed to register: {reg_res.text}")
    sys.exit(1)

print("Logging in...")
login_res = requests.post(f"{BASE_URL}/auth/login", data={
    "username": "paps_tester@test.com",
    "password": "password123"
})
if login_res.status_code != 200:
    print(f"Failed to login: {login_res.text}")
    sys.exit(1)

token = login_res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

print("Setting username...")
requests.put(f"{BASE_URL}/auth/me", json={"username": "PapsTester"}, headers=headers)

print("Creating course...")
course_res = requests.post(f"{BASE_URL}/courses/", json={
    "title": "PAPS Test Course",
    "description": "Course for testing PAPS unlocks"
}, headers=headers)

if course_res.status_code != 200:
    print(f"Failed to create course: {course_res.text}")
    sys.exit(1)

course_id = course_res.json()["id"]

print("Creating note...")
note_data = {
    "title": "Secret Note for PAPS",
    "course_id": str(course_id),
    "paps_price": "500",
    "is_public": False
}

files = {
    "content": (None, "This is a secret note that costs 500 PAPS to unlock."),
    "title": (None, "Secret Note for PAPS"),
    "course_id": (None, str(course_id)),
    "paps_price": (None, "500")
}

note_res = requests.post(f"{BASE_URL}/notes/", files=files, headers=headers)

if note_res.status_code != 200:
    print(f"Failed to create note: {note_res.text}")
    sys.exit(1)
    
print(f"Successfully created note.")
print("Logging out.")
