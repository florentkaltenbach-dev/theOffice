# Utils package initialization
# Written by: Marcus Chen

"""
Utilities package for Nexus Software Solutions office simulation.
"""

from .display import Display
from .config import (
    OFFICE_CONFIG,
    SIMULATION_CONFIG,
    DISPLAY_CONFIG,
    PROJECT_CONFIG,
    get_config
)

__all__ = [
    'Display',
    'OFFICE_CONFIG',
    'SIMULATION_CONFIG',
    'DISPLAY_CONFIG',
    'PROJECT_CONFIG',
    'get_config',
]
