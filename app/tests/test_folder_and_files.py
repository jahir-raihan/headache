import os
import sys

# Add the parent directory to PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

import pytest
from fastapi.testclient import TestClient
from fastapi import UploadFile
from io import BytesIO

from app.main import app

client = TestClient(app)

# Test data
test_folder_data = {
    "name": "Test Folder",
    "parent_id": None
}

test_file_content = b"Hello, this is a test file!"

@pytest.fixture
def sample_folder():
    """Create a sample folder and return its ID"""
    response = client.post("/folder-create", json=test_folder_data)
    assert response.status_code == 200
    return response.json()["id"]

@pytest.fixture
def sample_file():
    """Create a sample file and return its ID"""
    files = {"file": ("test.txt", BytesIO(test_file_content), "text/plain")}
    response = client.post("/file-create", files=files)
    assert response.status_code == 200
    return response.json()["id"]


def test_create_folder():
    """Test creating a new folder"""
    response = client.post("/folder-create", json=test_folder_data)
    assert response.status_code == 200
    assert response.json()["name"] == test_folder_data["name"]


def test_create_nested_folder(sample_folder):
    """Test creating a nested folder"""
    nested_folder_data = {
        "name": "Nested Folder",
        "parent_id": sample_folder
    }
    response = client.post(f"/folder-create/{sample_folder}", json=nested_folder_data)
    assert response.status_code == 200
    assert response.json()["parent_id"] == sample_folder


def test_update_folder(sample_folder):
    """Test updating a folder's name"""
    update_data = {"name": "Updated Folder Name"}
    response = client.patch(f"/folder-update/{sample_folder}", json=update_data)
    assert response.status_code == 200
    assert response.json()["name"] == update_data["name"]


def test_delete_folder(sample_folder):
    """Test deleting a folder"""
    response = client.delete(f"/folder-delete/{sample_folder}")
    assert response.status_code == 200
    assert response.json()["ok"] == True


def test_create_file():
    """Test creating a new file"""
    files = {"file": ("test.txt", BytesIO(test_file_content), "text/plain")}
    response = client.post("/file-create", files=files)
    assert response.status_code == 200
    assert response.json()["name"] == "test.txt"


def test_create_file_in_folder(sample_folder):
    """Test creating a file inside a folder"""
    files = {"file": ("test.txt", BytesIO(test_file_content), "text/plain")}
    response = client.post(f"/file-create/{sample_folder}", files=files)
    assert response.status_code == 200
    assert response.json()["folder_id"] == sample_folder


def test_update_file(sample_file):
    """Test updating a file's name"""
    update_data = {"name": "updated_test.txt"}
    response = client.post(f"/file-update/{sample_file}", json=update_data)
    assert response.status_code == 200
    assert response.json()["name"] == update_data["name"]


def test_delete_file(sample_file):
    """Test deleting a file"""
    response = client.delete(f"/file-delete/{sample_file}")
    assert response.status_code == 200
    assert response.json()["ok"] == True


def test_folder_details():
    """Test getting folder details without any filters"""
    response = client.get("/folder-details")
    assert response.status_code == 200
    assert "folders" in response.json()
    assert "documents" in response.json()


def test_folder_details_with_search():
    """Test searching folders and files"""
    response = client.get("/folder-details", params={"q": "test"})
    assert response.status_code == 200
    assert "folders" in response.json()
    assert "documents" in response.json()


def test_folder_details_specific_folder(sample_folder):
    """Test getting details of a specific folder"""
    response = client.get(f"/folder-details/{sample_folder}")
    assert response.status_code == 200
    assert "folders" in response.json()
    assert "documents" in response.json()


def test_folder_upload(sample_folder):
    """Test uploading multiple files preserving folder structure"""
    files = [
        ("files", ("folder1/test1.txt", BytesIO(b"test1"), "text/plain")),
        ("files", ("folder1/test2.txt", BytesIO(b"test2"), "text/plain"))
    ]
    paths = ["folder1/test1.txt", "folder1/test2.txt"]
    data = {"paths": paths}
    response = client.post(f"/folder-upload/{sample_folder}", files=files, data=data)
    assert response.status_code == 200


def test_nonexistent_folder():
    """Test accessing a non-existent folder"""
    response = client.get("/folder-details/99999")
    assert response.status_code == 404


def test_invalid_folder_update():
    """Test updating a non-existent folder"""
    update_data = {"name": "Invalid Update"}
    response = client.patch("/folder-update/99999", json=update_data)
    assert response.status_code == 404


def test_invalid_file_delete():
    """Test deleting a non-existent file"""
    response = client.delete("/file-delete/99999")
    assert response.status_code == 404


def test_empty_folder_upload():
    """Test folder upload with no files"""
    response = client.post("/folder-upload", files=[], data={"paths": []})
    assert response.status_code == 422  # Validation error


def test_folder_circular_reference(sample_folder):
    """Test preventing circular folder references"""
    update_data = {"parent_id": sample_folder}
    response = client.patch(f"/folder-update/{sample_folder}", json=update_data)
    assert response.status_code == 400  # Bad request


