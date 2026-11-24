import os
import sys
from types import SimpleNamespace

import pytest

# main.py refuses to start without a key; tests never call Groq for real.
os.environ.setdefault("GROQ_API_KEY", "test-key")
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import main  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402


@pytest.fixture
def client():
    # Not used as a context manager, so the keep-alive startup task never runs.
    return TestClient(main.app)


@pytest.fixture
def fake_groq(monkeypatch):
    """Replace Groq with a recorder: every chat call's messages are kept in
    .messages and the reply streams back as a single "ok" chunk."""
    calls = SimpleNamespace(messages=[])

    def create(**kwargs):
        calls.messages.append(kwargs.get("messages"))
        chunk = SimpleNamespace(choices=[SimpleNamespace(delta=SimpleNamespace(content="ok"))])
        return [chunk]

    fake_client = SimpleNamespace(chat=SimpleNamespace(completions=SimpleNamespace(create=create)))
    monkeypatch.setattr(main, "groq_call", lambda make_request: make_request(fake_client))
    return calls
