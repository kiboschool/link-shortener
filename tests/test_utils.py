# test_utils.py
import os
import yaml
import time
import requests
import subprocess
import signal
from bs4 import BeautifulSoup
from pathlib import Path
from typing import Optional, Dict, Any, List
from dataclasses import dataclass

@dataclass
class CreatedUrl:
    """Represents a URL that was created by the service"""
    shortened_url: str
    original_url: str
    shortcode: str

class AppServer:
    def __init__(self, app_dir: str):
        self.app_dir = Path(app_dir)
        self.config = self._load_config()
        self.process: Optional[subprocess.Popen] = None
        self.base_url = f"http://{self.config.get('host', 'localhost')}:{self.config.get('port', 3000)}"

    def create_url(self, url: str) -> CreatedUrl:
        """Helper to create a URL and parse the response"""
        response = requests.post(
            f"{self.base_url}/",
            data={"url": url}
        )
        if response.status_code != 200:
            self.debug_response(response)
            raise ValueError(f"Failed to create URL: {response.status_code}")

        shortened_url = self.extract_shortened_url(response.text)
        return CreatedUrl(
            shortened_url=shortened_url,
            original_url=url,
            shortcode=shortened_url.split('/')[-1]
        )

    def extract_shortened_url(self, html: str) -> str:
        """Extract shortened URL using proper HTML parsing"""
        soup = BeautifulSoup(html, 'html.parser')
        textarea = soup.find('textarea')
        if textarea:
            return textarea.text.strip()
        
        raise ValueError(f"Could not find shortened URL in response HTML")

    def debug_response(self, response):
        """Print useful debug info about a response"""
        print("\n=== Response Debug Info ===")
        print(f"Status: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        print("Body:")
        print(response.text)
        if 'text/html' in response.headers.get('Content-Type', ''):
            soup = BeautifulSoup(response.text, 'html.parser')
            print("\nParsed HTML structure:")
            print(soup.prettify())
        print("=========================\n")


    def _load_config(self) -> Dict[str, Any]:
        config_path = self.app_dir / "test_config.yaml"
        if not config_path.exists():
            raise FileNotFoundError(f"No test_config.yaml found in {self.app_dir}")
        with open(config_path) as f:
            return yaml.safe_load(f)

    def setup_db(self):
        """Ensure DB is created and migrated before starting server"""
        setup_cmds = self.config.get("db_setup", [])
        for cmd in setup_cmds:
            result = subprocess.run(cmd, shell=True, cwd=self.app_dir)
            if result.returncode != 0:
                raise Exception(f"DB setup command failed: {cmd}")

    def cleanup_db(self):
        """Clear data between tests without full DB recreation"""
        cleanup_cmds = self.config.get("db_cleanup", [])
        for cmd in cleanup_cmds:
            result = subprocess.run(cmd, shell=True, cwd=self.app_dir)
            if result.returncode != 0:
                raise Exception(f"DB cleanup command failed: {cmd}")

    def start(self):
        """Start server after ensuring DB is ready"""
        cmd = self.config["start_command"]
        if isinstance(cmd, list):
            cmd = " ".join(cmd)
        
        env = os.environ.copy()
        env.update(self.config.get("env", {}))
        
        self.process = subprocess.Popen(
            cmd,
            shell=True,
            cwd=self.app_dir,
            env=env,
            start_new_session=True 
        )
        
        # Wait for server to start AND be ready
        max_retries = 30
        for _ in range(max_retries):
            try:
                requests.get(f"{self.base_url}/")
                break
            except requests.exceptions.ConnectionError:
                time.sleep(0.5)
        else:
            raise Exception("Server failed to start")

    def stop(self):
        """Stop the server and cleanup"""
        if self.process:
            os.killpg(self.process.pid, signal.SIGKILL)
            self.process.terminate()
            self.process.wait()
            self.process = None

        # Run cleanup commands if specified
        cleanup_cmds = self.config.get("cleanup_commands", [])
        for cmd in cleanup_cmds:
            subprocess.run(cmd, shell=True, cwd=self.app_dir)

    def __enter__(self):
        self.start()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.stop()
