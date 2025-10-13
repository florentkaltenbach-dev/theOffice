# Written by: Marcus Chen - Senior Architecture Lead
# Assisted by: Diana Foster
# Reviewed by: Alexandra Morrison
# Status: Production-Ready

"""
Configuration Module
Central configuration for Nexus Software Solutions office simulation.
"""

# Office Configuration
OFFICE_CONFIG = {
    "company_name": "Nexus Software Solutions",
    "floor_number": 14,
    "address": "Downtown Tech District",
    "total_employees": 47,
    "business_hours": "9:00 AM - 6:00 PM",
    "timezone": "Local",
}

# Simulation Settings
SIMULATION_CONFIG = {
    "enable_random_events": True,
    "coffee_machine_break_chance": 0.05,
    "bobby_accident_chance": 0.10,
    "verbose_logging": True,
}

# Display Settings
DISPLAY_CONFIG = {
    "use_colors": True,
    "use_emojis": True,
    "line_width": 70,
}

# Project Management Settings
PROJECT_CONFIG = {
    "max_concurrent_projects": 5,
    "default_sprint_length": 14,  # days
    "require_code_review": True,
    "require_qa_approval": True,
}


def get_config(category: str) -> dict:
    """Get configuration for a specific category."""
    configs = {
        "office": OFFICE_CONFIG,
        "simulation": SIMULATION_CONFIG,
        "display": DISPLAY_CONFIG,
        "project": PROJECT_CONFIG,
    }
    return configs.get(category, {})


if __name__ == "__main__":
    print("Configuration loaded successfully!")
    print(f"Company: {OFFICE_CONFIG['company_name']}")
    print(f"Employees: {OFFICE_CONFIG['total_employees']}")
