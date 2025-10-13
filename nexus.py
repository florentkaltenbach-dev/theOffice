# Written by: Kevin O'Brien - DevOps Lead
# Assisted by: Raj Kumar, Sofia Rodriguez
# Reviewed by: Alexandra Morrison, Marcus Chen
# Status: Production-Ready

"""
Nexus Engine
The core simulation engine that runs Nexus Software Solutions.
Coordinates office, employees, and project management.
"""

import sys
import os

# Add the current directory to Python path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from typing import List, Dict, Optional
from office_builder import OfficeBuilder, Room
from employees import Employee, EmployeeFactory, Team, Skill
from utils.display import Display


class NexusOffice:
    """
    Main simulation engine for Nexus Software Solutions.
    Manages the office environment, employees, and operations.
    """

    def __init__(self):
        self.display = Display()
        self.office_builder: Optional[OfficeBuilder] = None
        self.employees: List[Employee] = []
        self.initialized = False
        self.projects_completed = 0

    def initialize(self) -> None:
        """Initialize the complete office system."""
        if self.initialized:
            self.display.warning("Office already initialized!")
            return

        self.display.welcome_banner()
        self.display.header("NEXUS OFFICE INITIALIZATION SEQUENCE")

        # Step 1: Build the office
        self.display.info("PHASE 1: Office Construction")
        self.office_builder = OfficeBuilder()
        self.office_builder.build()

        # Step 2: Create all employees
        self.display.info("\nPHASE 2: Employee Initialization")
        print("\n  👥 Hiring and onboarding employees...")
        factory = EmployeeFactory()
        self.employees = factory.create_all_employees()

        # Step 3: Assign employees to rooms
        self.display.info("\nPHASE 3: Workspace Assignment")
        print("\n  🪑 Assigning employees to their workspaces...")
        self._assign_employees_to_rooms()

        # Step 4: System ready
        self.initialized = True
        self.display.header("✨ NEXUS SOFTWARE SOLUTIONS IS OPERATIONAL ✨")

        self._display_initialization_summary()

    def _assign_employees_to_rooms(self) -> None:
        """Assign all employees to their designated rooms."""
        for employee in self.employees:
            room_name = employee.location
            if self.office_builder.assign_employee_to_room(employee.name, room_name):
                print(f"    ✓ {employee.name:30} → {room_name}")
            else:
                print(f"    ⚠ {employee.name:30} → {room_name} (room full, flexible seating)")

    def _display_initialization_summary(self) -> None:
        """Display summary after initialization."""
        available = len([e for e in self.employees if e.available])
        busy = len(self.employees) - available

        self.display.office_status(len(self.employees), available, busy)

        print(f"\n{Display.BOLD}🏢 Office Layout:{Display.RESET}")
        print(f"  • Total Rooms: {len(self.office_builder.rooms)}")
        print(f"  • Conference Rooms: 4")
        print(f"  • Team Pods: 6")
        print(f"  • Private Offices: 3")

        print(f"\n{Display.BOLD}👥 Team Composition:{Display.RESET}")
        for team in Team:
            team_members = EmployeeFactory.get_team_members(self.employees, team)
            if team_members:
                print(f"  • {team.value:25} {len(team_members):2} members")

        self.display.separator()
        self.display.success("All systems operational. Ready for customer projects!")
        print()

    def get_employee(self, name: str) -> Optional[Employee]:
        """Get employee by name."""
        return EmployeeFactory.find_employee_by_name(self.employees, name)

    def get_team(self, team: Team) -> List[Employee]:
        """Get all members of a specific team."""
        return EmployeeFactory.get_team_members(self.employees, team)

    def get_available_employees(self) -> List[Employee]:
        """Get all available employees."""
        return EmployeeFactory.get_available_employees(self.employees)

    def find_experts(self, skills: List[Skill]) -> List[Employee]:
        """Find employees with specific skills."""
        return EmployeeFactory.find_experts(self.employees, skills)

    def show_office_layout(self) -> None:
        """Display the office layout."""
        if not self.initialized:
            self.display.error("Office not initialized yet!")
            return
        self.office_builder.display_office()

    def show_employee_directory(self) -> None:
        """Display complete employee directory."""
        if not self.initialized:
            self.display.error("Office not initialized yet!")
            return

        self.display.header("EMPLOYEE DIRECTORY")

        for team in Team:
            team_members = self.get_team(team)
            if team_members:
                self.display.team_roster(team.value, team_members)

        print()

    def show_team(self, team: Team) -> None:
        """Display specific team information."""
        if not self.initialized:
            self.display.error("Office not initialized yet!")
            return

        team_members = self.get_team(team)
        self.display.header(f"{team.value.upper()} TEAM")

        for employee in team_members:
            self.display.employee_card(employee)

        print()

    def reception_greeting(self) -> None:
        """Display reception greeting."""
        self.display.dialogue(
            "NEXUS OFFICE - Reception, 9:00 AM",
            "Reception",
            "Good morning, Nexus Software Solutions, how may I direct your call?"
        )

    def start_project(self, project_name: str, customer_name: str) -> None:
        """Start a new customer project."""
        if not self.initialized:
            self.display.error("Office not initialized yet! Please run initialize() first.")
            return

        self.display.project_banner(project_name, customer_name)
        self.display.dialogue(
            "Product Director Office",
            "Diana Foster",
            f"Excellent! We have a new project: '{project_name}' for {customer_name}. "
            f"Let me gather the team..."
        )

    def office_tour(self) -> None:
        """Give a tour of the office."""
        if not self.initialized:
            self.display.error("Office not initialized yet!")
            return

        self.display.header("OFFICE TOUR")
        self.display.narration("*Walking through the glass doors onto the 14th floor*")

        tour_stops = [
            ("Reception", "The welcoming entrance with marble desk and comfortable seating"),
            ("Frontend Team Pod", "Where Sarah's team crafts beautiful user interfaces"),
            ("Backend Team Pod", "Roberto and team building robust server architecture"),
            ("QA Testing Lab", "Jessica's domain - where bugs come to die"),
            ("DevOps Pod", "Kevin's command center - keeping everything running smoothly"),
            ("Design Studio", "Paulo's creative space with color-calibrated monitors"),
            ("The War Room", "For intense planning sessions and critical decisions"),
            ("Kitchen", "Coffee machines, espresso bar, and snacks - the true heart of any tech company"),
        ]

        for room_name, description in tour_stops:
            room = self.office_builder.get_room(room_name)
            if room:
                print(f"\n{Display.BOLD}📍 {room_name}{Display.RESET}")
                print(f"   {description}")
                if room.occupied_by:
                    print(f"   Currently here: {', '.join(room.occupied_by[:3])}", end="")
                    if len(room.occupied_by) > 3:
                        print(f" and {len(room.occupied_by) - 3} others")
                    else:
                        print()

        self.display.separator()
        self.display.narration("*Tour complete. Floor-to-ceiling windows offer stunning city views*")
        print()

    def status(self) -> Dict:
        """Get current office status."""
        if not self.initialized:
            return {
                "initialized": False,
                "message": "Office not initialized"
            }

        available = len(self.get_available_employees())
        busy = len(self.employees) - available

        return {
            "initialized": True,
            "total_employees": len(self.employees),
            "available_employees": available,
            "busy_employees": busy,
            "total_rooms": len(self.office_builder.rooms),
            "projects_completed": self.projects_completed
        }

    def emergency_meeting(self, topic: str) -> None:
        """Call an emergency all-hands meeting."""
        if not self.initialized:
            self.display.error("Office not initialized yet!")
            return

        self.display.header("🚨 EMERGENCY MEETING 🚨")
        self.display.narration("*Slack notification pings across the office*")
        self.display.dialogue(
            "Slack - #general",
            "Diana Foster",
            f"@channel Emergency meeting in The War Room NOW. Topic: {topic}"
        )
        self.display.narration("*Employees stream toward The War Room, coffee cups in hand*")

        war_room = self.office_builder.get_room("The War Room")
        if war_room:
            print(f"\n{Display.BOLD}The War Room - All Hands Meeting{Display.RESET}")
            print(f"  Capacity: {war_room.capacity} (Currently packed with {len(self.employees)} people)")
            print(f"  Topic: {Display.YELLOW}{topic}{Display.RESET}")

        print()


if __name__ == "__main__":
    # Test the Nexus engine
    nexus = NexusOffice()
    nexus.initialize()
    nexus.show_office_layout()
    print("\n✓ Nexus engine test complete!")
