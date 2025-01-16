import pytest
from pathlib import Path
from .test_utils import AppServer
from typing import List

def get_available_apps() -> List[str]:
    """Get list of all apps with test_config.yaml files"""
    root_dir = Path(__file__).parent.parent
    return [
        d.name for d in root_dir.iterdir() 
        if d.is_dir() and (d / "test_config.yaml").exists()
    ]

def pytest_addoption(parser):
    parser.addoption(
        "--app", 
        action="store",
        help="which app implementation to test (flask, fastapi, etc). Omit to test all."
    )

def pytest_generate_tests(metafunc):
    if "app_server" in metafunc.fixturenames:
        app_param = metafunc.config.getoption("--app")
        if app_param:
            apps = [app_param]
        else:
            apps = get_available_apps()
        
        metafunc.parametrize(
            "app_server",
            apps,
            indirect=True,
            ids=lambda x: f"app={x}"
        )

@pytest.fixture
def app_server(request):
    """
    Fixture that manages the full lifecycle of our test server:
    1. Set up database
    2. Start server
    3. Run tests
    4. Clean up data between tests
    5. Stop server
    """
    app_name = request.param
    app_dir = Path(__file__).parent.parent / app_name
    
    try:
        server = AppServer(app_dir)
        
        # Setup database before starting server
        server.setup_db()
        
        # Start server with configured database
        with server:
            yield server
            # Clean up after test
            server.cleanup_db()
            
    except FileNotFoundError as e:
        pytest.skip(f"App {app_name} not configured: {e}")
    except Exception as e:
        pytest.fail(f"Failed to run tests for {app_name}: {e}")
