# Written by: Marcus Chen - Senior Architecture Lead
# Reviewed by: Alexandra Morrison, Diana Foster
# Status: Production-Ready

"""
theOffice - Main Entry Point
A meta-recursive office simulation where software builds its office,
employees inhabit it, and they're ready to handle projects.

Created for: Florent
Company: Nexus Software Solutions
"""

import sys
import os

# Fix Windows console encoding for Unicode/emoji support
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Ensure imports work correctly
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from nexus import NexusOffice
from utils.display import Display


def main():
    """
    Main entry point for theOffice simulation.

    This is like a train pulling into the station, unloading passengers,
    and preparing for its next journey. 🚂
    """

    display = Display()

    # Create the Nexus office instance
    nexus = NexusOffice()

    # Initialize everything - build office, hire employees, assign workspaces
    nexus.initialize()

    # Show what we've built
    print("\n")
    display.header("WHAT WOULD YOU LIKE TO SEE?")
    print("""
  Available commands:

    1. nexus.show_office_layout()       - View the complete office layout
    2. nexus.show_employee_directory()  - See all 47 employees
    3. nexus.office_tour()              - Take a guided tour
    4. nexus.show_team(Team.FRONTEND)   - View a specific team
    5. nexus.reception_greeting()       - Hear from reception
    6. nexus.start_project(name, customer) - Begin a new project

  Example:
    nexus.start_project("Mobile App Fix", "TechStartup Inc.")

    """)

    display.info("The office is ready. All employees are at their stations.")
    display.info("Try the commands above, or start working on your next project!")

    print("\n" + "="*70)
    print(f"  {Display.BOLD}💼 Nexus Software Solutions - Ready to serve{Display.RESET}")
    print("="*70 + "\n")

    # Return the nexus instance so Florent can interact with it
    return nexus


if __name__ == "__main__":
    # When run directly, initialize and return the office
    nexus = main()

    # Keep the office "alive" - make nexus available in the namespace
    print(f"{Display.CYAN}ℹ The 'nexus' object is now available for you to use!{Display.RESET}")
    print(f"{Display.CYAN}  Try: nexus.office_tour() or nexus.show_employee_directory(){Display.RESET}\n")
