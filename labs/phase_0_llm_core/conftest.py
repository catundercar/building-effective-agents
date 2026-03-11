"""Shared pytest fixtures for Phase 0."""

import sys
from pathlib import Path

# Add shared utilities to path
sys.path.insert(0, str(Path(__file__).parent.parent / "shared"))
