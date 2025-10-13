# Written by: Paulo Santos - Creative Director
# Assisted by: Katie Lin - UI Designer
# Reviewed by: Sarah Williams
# Status: Production-Ready

"""
Display Utilities
Beautiful terminal visualization for the Nexus office simulation.
"""

from typing import List, Dict
from employees import Employee, Team


class Display:
    """Handles all visual output for the office simulation."""

    # Color codes for terminal (ANSI)
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"

    # Colors
    BLUE = "\033[94m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    CYAN = "\033[96m"
    MAGENTA = "\033[95m"

    @staticmethod
    def header(text: str) -> None:
        """Display a section header."""
        print(f"\n{Display.BOLD}{Display.BLUE}{'='*70}{Display.RESET}")
        print(f"{Display.BOLD}{Display.BLUE}  {text}{Display.RESET}")
        print(f"{Display.BOLD}{Display.BLUE}{'='*70}{Display.RESET}\n")

    @staticmethod
    def subheader(text: str) -> None:
        """Display a subsection header."""
        print(f"\n{Display.BOLD}{text}{Display.RESET}")
        print(f"{'-'*70}")

    @staticmethod
    def success(text: str) -> None:
        """Display success message."""
        print(f"{Display.GREEN}✓ {text}{Display.RESET}")

    @staticmethod
    def info(text: str) -> None:
        """Display info message."""
        print(f"{Display.CYAN}ℹ {text}{Display.RESET}")

    @staticmethod
    def warning(text: str) -> None:
        """Display warning message."""
        print(f"{Display.YELLOW}⚠ {text}{Display.RESET}")

    @staticmethod
    def error(text: str) -> None:
        """Display error message."""
        print(f"{Display.RED}✗ {text}{Display.RESET}")

    @staticmethod
    def employee_card(employee: Employee) -> None:
        """Display an employee information card."""
        print(f"\n  {Display.BOLD}{employee.name}{Display.RESET}")
        print(f"  Role: {employee.role}")
        print(f"  Team: {Display.CYAN}{employee.team.value}{Display.RESET}")
        print(f"  Location: {employee.location}")
        print(f"  Skills: {', '.join([skill.value for skill in employee.skills[:4]])}")
        if employee.quirks:
            print(f"  Quirk: {Display.YELLOW}{employee.quirks[0]}{Display.RESET}")

    @staticmethod
    def team_roster(team_name: str, employees: List[Employee]) -> None:
        """Display a team roster."""
        print(f"\n{Display.BOLD}{Display.CYAN}{team_name}{Display.RESET} ({len(employees)} members)")
        for emp in employees:
            status = "🟢" if emp.available else "🔴"
            print(f"  {status} {emp.name:25} - {emp.role}")

    @staticmethod
    def office_status(total_employees: int, available: int, busy: int) -> None:
        """Display office status overview."""
        print(f"\n{Display.BOLD}📊 OFFICE STATUS{Display.RESET}")
        print(f"  Total Employees: {total_employees}")
        print(f"  Available: {Display.GREEN}{available}{Display.RESET}")
        print(f"  Busy: {Display.YELLOW}{busy}{Display.RESET}")

    @staticmethod
    def dialogue(location: str, person: str, message: str) -> None:
        """Display dialogue from an employee."""
        print(f"\n{Display.DIM}[{location}]{Display.RESET}")
        print(f"{Display.BOLD}{person}:{Display.RESET} {message}")

    @staticmethod
    def narration(text: str) -> None:
        """Display narrative text."""
        print(f"\n{Display.DIM}{text}{Display.RESET}")

    @staticmethod
    def code_block(code: str, author: str, status: str) -> None:
        """Display a code block with metadata."""
        print(f"\n{Display.BOLD}{'─'*70}{Display.RESET}")
        print(f"{Display.DIM}Written by: {author} | Status: {status}{Display.RESET}")
        print(f"{Display.BOLD}{'─'*70}{Display.RESET}")
        print(code)
        print(f"{Display.BOLD}{'─'*70}{Display.RESET}\n")

    @staticmethod
    def project_banner(project_name: str, customer: str) -> None:
        """Display project information banner."""
        print(f"\n{Display.BOLD}{Display.MAGENTA}{'='*70}{Display.RESET}")
        print(f"{Display.BOLD}{Display.MAGENTA}  📋 PROJECT: {project_name}{Display.RESET}")
        print(f"{Display.BOLD}{Display.MAGENTA}  👤 CUSTOMER: {customer}{Display.RESET}")
        print(f"{Display.BOLD}{Display.MAGENTA}{'='*70}{Display.RESET}\n")

    @staticmethod
    def separator() -> None:
        """Display a visual separator."""
        print(f"\n{Display.DIM}{'─'*70}{Display.RESET}\n")

    @staticmethod
    def welcome_banner() -> None:
        """Display welcome banner."""
        banner = f"""
{Display.BOLD}{Display.CYAN}
===================================================================

               NEXUS SOFTWARE SOLUTIONS
           Professional Software Development Services

                   14th Floor, Tech District
                   Ready to serve you

===================================================================
{Display.RESET}
        """
        print(banner)


if __name__ == "__main__":
    # Test display functions
    Display.welcome_banner()
    Display.header("TEST DISPLAY SYSTEM")
    Display.success("Display module working perfectly!")
    Display.info("All formatting functions operational")
    Display.warning("Remember to use colors sparingly")
