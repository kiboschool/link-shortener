# tests/test_shortener.py
import pytest
import requests
from urllib.parse import urlparse

def test_create_url(app_server):
    """Test basic URL creation"""
    created = app_server.create_url("https://example.com")
    assert len(created.shortcode) == 6
    assert created.original_url == "https://example.com"
    assert created.shortened_url.endswith(created.shortcode)

def test_create_url_adds_protocol(app_server):
    """Test URL creation adds protocol if missing"""
    # Some implementations might add the protocol in the response, others in the redirect
    # Let's test the behavior via redirection
    created = app_server.create_url("example.com")
    response = requests.get(created.shortened_url, allow_redirects=False)
    assert response.headers['Location'].startswith('https://')

def test_redirect(app_server):
    """Test URL redirection works"""
    created = app_server.create_url("https://example.com/bar")
    response = requests.get(created.shortened_url, allow_redirects=False)
    assert response.status_code == 302
    assert response.headers['Location'] == "https://example.com/bar"

def test_list_urls(app_server):
    """Test listing all URLs"""
    # Create a few URLs first
    urls = ["https://example.com", "https://example.org"]
    created = [app_server.create_url(url) for url in urls]
    
    # Get the list page
    response = requests.get(f"{app_server.base_url}/urls")
    assert response.status_code == 200
    for url in created:
        assert url.original_url in response.text
        assert url.shortcode in response.text

def test_edit_url(app_server):
    """Test editing a shortened URL"""
    created = app_server.create_url("https://example.com/bar")
    
    # Try to edit it
    edit_response = requests.post(
        f"{app_server.base_url}/urls/edit/{created.shortcode}",
        data={"shortened": "custom"},
        allow_redirects=False  # Don't follow redirects
    )
    assert edit_response.status_code == 302
    
    # Verify the redirect works with new code
    response = requests.get(
        f"{app_server.base_url}/custom",
        allow_redirects=False
    )
    assert response.status_code == 302
    assert response.headers['Location'] == "https://example.com/bar"

def test_delete_url(app_server):
    """Test deleting a URL"""
    created = app_server.create_url("https://example.com")
    
    # Delete it
    delete_response = requests.post(
        f"{app_server.base_url}/urls/delete/{created.shortcode}",
        allow_redirects=False  # Don't follow redirects
    )
    assert delete_response.status_code == 302
    
    # Verify it's gone
    response = requests.get(
        f"{app_server.base_url}/{created.shortcode}",
        allow_redirects=False
    )
    assert response.status_code == 404
