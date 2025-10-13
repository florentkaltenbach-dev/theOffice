# Written by: Roberto Silva - Backend Team Lead
# Assisted by: Emma Chen, David Park
# Reviewed by: Marcus Chen, Alexandra Morrison
# Status: Production-Ready

"""
Employee Management System
Defines all 47 employees of Nexus Software Solutions with their roles,
personalities, skills, and behaviors.
"""

from typing import List, Dict, Optional
from dataclasses import dataclass, field
from enum import Enum
import random


class Team(Enum):
    """Employee team classifications."""
    ARCHITECTURE = "Architecture"
    FRONTEND = "Frontend"
    BACKEND = "Backend"
    QA = "QA"
    DEVOPS = "DevOps"
    PRODUCT = "Product Management"
    DATA = "Data Analytics"
    CUSTOMER_SUCCESS = "Customer Success"
    EXECUTIVE = "Executive"
    SECURITY = "Security"
    DESIGN = "Design"
    INTERN = "Intern"


class Skill(Enum):
    """Technical and soft skills."""
    PYTHON = "Python"
    JAVASCRIPT = "JavaScript"
    TYPESCRIPT = "TypeScript"
    REACT = "React"
    NODEJS = "Node.js"
    DATABASES = "Databases"
    CLOUD = "Cloud Infrastructure"
    SECURITY = "Security"
    TESTING = "Testing"
    DESIGN = "Design"
    LEADERSHIP = "Leadership"
    COMMUNICATION = "Communication"
    ARCHITECTURE = "Architecture"
    DEVOPS = "DevOps"
    DATA_ANALYSIS = "Data Analysis"
    PROJECT_MANAGEMENT = "Project Management"
    UX = "UX Design"
    UI = "UI Design"


@dataclass
class Employee:
    """Represents an employee at Nexus Software Solutions."""
    name: str
    role: str
    team: Team
    skills: List[Skill]
    personality_traits: List[str]
    quirks: List[str] = field(default_factory=list)
    current_task: Optional[str] = None
    location: str = "Not assigned"
    available: bool = True

    def __repr__(self) -> str:
        return f"Employee({self.name}, {self.role}, {self.team.value})"

    def assign_task(self, task: str) -> None:
        """Assign a task to this employee."""
        self.current_task = task
        self.available = False

    def complete_task(self) -> str:
        """Mark current task as complete."""
        completed = self.current_task
        self.current_task = None
        self.available = True
        return completed

    def get_introduction(self) -> str:
        """Get employee introduction message."""
        return f"{self.name} - {self.role} ({self.team.value})"

    def say(self, message: str, context: str = "") -> str:
        """Generate employee dialogue."""
        location_info = f"[{self.location}]" if context else ""
        return f"{location_info}\n{self.name}: {message}"

    def can_help_with(self, required_skills: List[Skill]) -> bool:
        """Check if employee has required skills."""
        return any(skill in self.skills for skill in required_skills)


class EmployeeFactory:
    """
    Factory para criar todos os 47 funcionários da Nexus Software Solutions.
    Creates all employees with their unique personalities and skills.
    """

    @staticmethod
    def create_all_employees() -> List[Employee]:
        """Create and return all 47 employees."""
        employees = []

        # Architecture Team
        employees.append(Employee(
            name="Marcus Chen",
            role="Senior Architecture Lead",
            team=Team.ARCHITECTURE,
            skills=[Skill.ARCHITECTURE, Skill.PYTHON, Skill.LEADERSHIP, Skill.CLOUD],
            personality_traits=["Strategic thinker", "Calm under pressure", "Mentoring"],
            quirks=["Uses transportation metaphors", "Has model trains in office"],
            location="Architecture Lead Office"
        ))

        # Frontend Team
        employees.append(Employee(
            name="Sarah Williams",
            role="Frontend Team Lead",
            team=Team.FRONTEND,
            skills=[Skill.TYPESCRIPT, Skill.REACT, Skill.JAVASCRIPT, Skill.LEADERSHIP],
            personality_traits=["Detail-oriented", "Type-safety advocate", "Perfectionist"],
            quirks=["Insists on proper TypeScript types", "Color-codes everything"],
            location="Frontend Team Pod"
        ))

        employees.append(Employee(
            name="Jake Morrison",
            role="Senior Frontend Developer",
            team=Team.FRONTEND,
            skills=[Skill.REACT, Skill.JAVASCRIPT, Skill.UI],
            personality_traits=["Creative", "Fast coder", "UI enthusiast"],
            quirks=["Always has latest tech gadgets"],
            location="Frontend Team Pod"
        ))

        employees.append(Employee(
            name="Priya Patel",
            role="Frontend Developer",
            team=Team.FRONTEND,
            skills=[Skill.REACT, Skill.TYPESCRIPT, Skill.DESIGN],
            personality_traits=["Thorough", "Team player", "Quick learner"],
            quirks=["Makes the best chai in the office"],
            location="Frontend Team Pod"
        ))

        employees.append(Employee(
            name="Tom Bradley",
            role="Frontend Developer",
            team=Team.FRONTEND,
            skills=[Skill.JAVASCRIPT, Skill.REACT, Skill.TESTING],
            personality_traits=["Reliable", "Documentation lover", "Patient"],
            quirks=["Writes haikus in code comments"],
            location="Frontend Team Pod"
        ))

        employees.append(Employee(
            name="Lin Zhang",
            role="Junior Frontend Developer",
            team=Team.FRONTEND,
            skills=[Skill.JAVASCRIPT, Skill.REACT],
            personality_traits=["Eager", "Curious", "Hardworking"],
            quirks=["Asks lots of questions", "Takes detailed notes"],
            location="Frontend Team Pod"
        ))

        # Backend Team
        employees.append(Employee(
            name="Roberto Silva",
            role="Backend Team Lead",
            team=Team.BACKEND,
            skills=[Skill.PYTHON, Skill.NODEJS, Skill.DATABASES, Skill.LEADERSHIP],
            personality_traits=["Bilingual", "Efficient", "Problem solver"],
            quirks=["Comments in English and Portuguese", "Loves Brazilian jazz"],
            location="Backend Team Pod"
        ))

        employees.append(Employee(
            name="Emma Chen",
            role="Senior Backend Developer",
            team=Team.BACKEND,
            skills=[Skill.PYTHON, Skill.DATABASES, Skill.CLOUD],
            personality_traits=["Analytical", "Performance-focused", "Mentor"],
            quirks=["Optimizes everything", "Runs marathons"],
            location="Backend Team Pod"
        ))

        employees.append(Employee(
            name="David Park",
            role="Backend Developer",
            team=Team.BACKEND,
            skills=[Skill.PYTHON, Skill.NODEJS, Skill.DATABASES],
            personality_traits=["Methodical", "Database expert", "Collaborative"],
            quirks=["Names all databases after Star Wars characters"],
            location="Backend Team Pod"
        ))

        # QA Department
        employees.append(Employee(
            name="Jessica Park",
            role="QA Lead",
            team=Team.QA,
            skills=[Skill.TESTING, Skill.PYTHON, Skill.LEADERSHIP],
            personality_traits=["Meticulous", "Quality-driven", "Diplomatic"],
            quirks=["Finds bugs in real life", "Has bug plushies on desk"],
            location="QA Testing Lab"
        ))

        employees.append(Employee(
            name="Ahmed Hassan",
            role="Senior QA Engineer",
            team=Team.QA,
            skills=[Skill.TESTING, Skill.PYTHON, Skill.JAVASCRIPT],
            personality_traits=["Sharp-eyed", "Edge-case hunter", "Persistent"],
            quirks=["Finds obscure edge-case bugs", "Collects vintage keyboards"],
            location="QA Testing Lab"
        ))

        employees.append(Employee(
            name="Natasha Volkov",
            role="QA Engineer",
            team=Team.QA,
            skills=[Skill.TESTING, Skill.PYTHON],
            personality_traits=["Thorough", "Automation advocate", "Patient"],
            quirks=["Automates everything possible", "Chess champion"],
            location="QA Testing Lab"
        ))

        # DevOps Team
        employees.append(Employee(
            name="Kevin O'Brien",
            role="DevOps Lead",
            team=Team.DEVOPS,
            skills=[Skill.DEVOPS, Skill.CLOUD, Skill.SECURITY, Skill.LEADERSHIP],
            personality_traits=["Cautious", "Reliability-focused", "Prepared"],
            quirks=["Backs up everything multiple times", "Has disaster recovery plans for lunch"],
            location="DevOps Pod"
        ))

        employees.append(Employee(
            name="Raj Kumar",
            role="DevOps Engineer",
            team=Team.DEVOPS,
            skills=[Skill.DEVOPS, Skill.CLOUD, Skill.PYTHON],
            personality_traits=["Efficient", "Infrastructure expert", "Calm"],
            quirks=["Monitors uptime obsessively", "Meditates during deployments"],
            location="DevOps Pod"
        ))

        employees.append(Employee(
            name="Sofia Rodriguez",
            role="DevOps Engineer",
            team=Team.DEVOPS,
            skills=[Skill.DEVOPS, Skill.CLOUD, Skill.SECURITY],
            personality_traits=["Proactive", "Security-minded", "Organized"],
            quirks=["Color-codes infrastructure", "Always has coffee"],
            location="DevOps Pod"
        ))

        # Product Management
        employees.append(Employee(
            name="Diana Foster",
            role="Director of Product Management",
            team=Team.PRODUCT,
            skills=[Skill.PROJECT_MANAGEMENT, Skill.LEADERSHIP, Skill.COMMUNICATION],
            personality_traits=["Strategic", "Customer-focused", "Diplomatic"],
            quirks=["Translates customer to technical", "Has perfect handwriting"],
            location="Product Director Office"
        ))

        employees.append(Employee(
            name="Ben Carter",
            role="Assistant Product Manager",
            team=Team.PRODUCT,
            skills=[Skill.PROJECT_MANAGEMENT, Skill.COMMUNICATION],
            personality_traits=["Organized", "Detail-oriented", "Supportive"],
            quirks=["Loves spreadsheets", "Makes perfect meeting notes"],
            location="Product Director Office"
        ))

        employees.append(Employee(
            name="Michelle Torres",
            role="Product Manager",
            team=Team.PRODUCT,
            skills=[Skill.PROJECT_MANAGEMENT, Skill.COMMUNICATION, Skill.DATA_ANALYSIS],
            personality_traits=["Data-driven", "User-focused", "Decisive"],
            quirks=["A/B tests everything", "Even her lunch choices"],
            location="Product Director Office"
        ))

        # Data Analytics
        employees.append(Employee(
            name="Dr. James Liu",
            role="Lead Data Scientist",
            team=Team.DATA,
            skills=[Skill.PYTHON, Skill.DATA_ANALYSIS, Skill.LEADERSHIP],
            personality_traits=["Analytical", "Academic", "Thorough"],
            quirks=["Cites papers in conversation", "Has three PhDs"],
            location="Data Analytics Suite"
        ))

        employees.append(Employee(
            name="Sandra Kim",
            role="Data Analyst",
            team=Team.DATA,
            skills=[Skill.PYTHON, Skill.DATA_ANALYSIS],
            personality_traits=["Visual thinker", "Pattern recognizer", "Creative"],
            quirks=["Sees data visualizations in clouds", "Loves infographics"],
            location="Data Analytics Suite"
        ))

        employees.append(Employee(
            name="Carlos Mendoza",
            role="Data Engineer",
            team=Team.DATA,
            skills=[Skill.PYTHON, Skill.DATABASES, Skill.DATA_ANALYSIS],
            personality_traits=["Pipeline expert", "Efficient", "Problem solver"],
            quirks=["Optimizes data pipelines in sleep", "Drums on desk"],
            location="Data Analytics Suite"
        ))

        # Customer Success
        employees.append(Employee(
            name="Grace Thompson",
            role="Customer Success Manager",
            team=Team.CUSTOMER_SUCCESS,
            skills=[Skill.COMMUNICATION, Skill.PROJECT_MANAGEMENT],
            personality_traits=["Empathetic", "Patient", "Solution-oriented"],
            quirks=["Never loses her cool", "Remembers everyone's birthday"],
            location="Reception"
        ))

        employees.append(Employee(
            name="Antoine Dubois",
            role="Customer Success Specialist",
            team=Team.CUSTOMER_SUCCESS,
            skills=[Skill.COMMUNICATION],
            personality_traits=["Multilingual", "Charming", "Detail-oriented"],
            quirks=["Speaks 5 languages", "Always has chocolates"],
            location="Reception"
        ))

        employees.append(Employee(
            name="Yuki Tanaka",
            role="Customer Success Specialist",
            team=Team.CUSTOMER_SUCCESS,
            skills=[Skill.COMMUNICATION, Skill.TESTING],
            personality_traits=["Attentive", "Technical", "Friendly"],
            quirks=["Can explain anything simply", "Origami master"],
            location="Reception"
        ))

        # Executive
        employees.append(Employee(
            name="Alexandra Morrison",
            role="Chief Technology Officer",
            team=Team.EXECUTIVE,
            skills=[Skill.LEADERSHIP, Skill.ARCHITECTURE, Skill.PYTHON, Skill.COMMUNICATION],
            personality_traits=["Visionary", "Strategic", "Supportive"],
            quirks=["Built the first version of the product", "Codes on weekends"],
            location="CTO Office"
        ))

        # Security Team
        employees.append(Employee(
            name="Dmitri Volkov",
            role="Security Engineer",
            team=Team.SECURITY,
            skills=[Skill.SECURITY, Skill.PYTHON, Skill.CLOUD],
            personality_traits=["Vigilant", "Paranoid (in a good way)", "Thorough"],
            quirks=["Finds security issues everywhere", "Uses 50-character passwords"],
            location="Server Room"
        ))

        employees.append(Employee(
            name="Vanessa Wright",
            role="Security Engineer",
            team=Team.SECURITY,
            skills=[Skill.SECURITY, Skill.PYTHON, Skill.TESTING],
            personality_traits=["Methodical", "Compliance-focused", "Detail-oriented"],
            quirks=["Reads security bulletins for fun", "Penetration testing enthusiast"],
            location="Server Room"
        ))

        # Design Team
        employees.append(Employee(
            name="Paulo Santos",
            role="Creative Director",
            team=Team.DESIGN,
            skills=[Skill.DESIGN, Skill.UI, Skill.UX, Skill.LEADERSHIP],
            personality_traits=["Creative", "User-focused", "Inspiring"],
            quirks=["Sketches constantly", "Talks about color theory"],
            location="Design Studio"
        ))

        employees.append(Employee(
            name="Katie Lin",
            role="UI Designer",
            team=Team.DESIGN,
            skills=[Skill.UI, Skill.DESIGN],
            personality_traits=["Pixel-perfect", "Modern aesthetics", "Collaborative"],
            quirks=["Can spot 1px misalignment", "Has Pantone color deck"],
            location="Design Studio"
        ))

        employees.append(Employee(
            name="Amit Shah",
            role="UX Designer",
            team=Team.DESIGN,
            skills=[Skill.UX, Skill.DESIGN, Skill.COMMUNICATION],
            personality_traits=["User advocate", "Research-driven", "Empathetic"],
            quirks=["Interviews strangers for user research", "Wireframe enthusiast"],
            location="Design Studio"
        ))

        # Intern
        employees.append(Employee(
            name="Bobby Chen",
            role="Software Engineering Intern",
            team=Team.INTERN,
            skills=[Skill.PYTHON, Skill.JAVASCRIPT],
            personality_traits=["Enthusiastic", "Eager to learn", "Accident-prone"],
            quirks=["Prone to breaking dev environment", "Asks great questions", "Once deleted production database (in training)"],
            location="Frontend Team Pod"
        ))

        # Additional team members to reach 47
        additional_employees = [
            ("Rachel Green", "Frontend Developer", Team.FRONTEND, [Skill.REACT, Skill.JAVASCRIPT], "Frontend Team Pod"),
            ("Michael Scott", "Product Manager", Team.PRODUCT, [Skill.PROJECT_MANAGEMENT, Skill.COMMUNICATION], "Product Director Office"),
            ("Dwight Schrute", "Security Analyst", Team.SECURITY, [Skill.SECURITY, Skill.TESTING], "Server Room"),
            ("Jim Halpert", "Backend Developer", Team.BACKEND, [Skill.PYTHON, Skill.DATABASES], "Backend Team Pod"),
            ("Pam Beesly", "UX Researcher", Team.DESIGN, [Skill.UX, Skill.COMMUNICATION], "Design Studio"),
            ("Stanley Hudson", "Senior Backend Engineer", Team.BACKEND, [Skill.PYTHON, Skill.DATABASES], "Backend Team Pod"),
            ("Phyllis Vance", "Customer Success Manager", Team.CUSTOMER_SUCCESS, [Skill.COMMUNICATION], "Reception"),
            ("Angela Martin", "QA Engineer", Team.QA, [Skill.TESTING, Skill.PYTHON], "QA Testing Lab"),
            ("Oscar Martinez", "Data Analyst", Team.DATA, [Skill.DATA_ANALYSIS, Skill.PYTHON], "Data Analytics Suite"),
            ("Kevin Malone", "Backend Developer", Team.BACKEND, [Skill.PYTHON, Skill.DATABASES], "Backend Team Pod"),
            ("Meredith Palmer", "DevOps Engineer", Team.DEVOPS, [Skill.DEVOPS, Skill.CLOUD], "DevOps Pod"),
            ("Creed Bratton", "Quality Assurance", Team.QA, [Skill.TESTING], "QA Testing Lab"),
            ("Ryan Howard", "Product Analyst", Team.PRODUCT, [Skill.PROJECT_MANAGEMENT, Skill.DATA_ANALYSIS], "Product Director Office"),
            ("Kelly Kapoor", "Customer Success Specialist", Team.CUSTOMER_SUCCESS, [Skill.COMMUNICATION], "Reception"),
            ("Toby Flenderson", "Compliance Officer", Team.SECURITY, [Skill.SECURITY], "Server Room"),
            ("Darryl Philbin", "DevOps Engineer", Team.DEVOPS, [Skill.DEVOPS, Skill.LEADERSHIP], "DevOps Pod"),
        ]

        for name, role, team, skills, location in additional_employees:
            employees.append(Employee(
                name=name,
                role=role,
                team=team,
                skills=skills,
                personality_traits=["Professional", "Reliable"],
                quirks=[],
                location=location
            ))

        return employees

    @staticmethod
    def find_employee_by_name(employees: List[Employee], name: str) -> Optional[Employee]:
        """Find employee by name."""
        for emp in employees:
            if emp.name.lower() == name.lower():
                return emp
        return None

    @staticmethod
    def get_team_members(employees: List[Employee], team: Team) -> List[Employee]:
        """Get all employees from a specific team."""
        return [emp for emp in employees if emp.team == team]

    @staticmethod
    def get_available_employees(employees: List[Employee]) -> List[Employee]:
        """Get all available employees."""
        return [emp for emp in employees if emp.available]

    @staticmethod
    def find_experts(employees: List[Employee], required_skills: List[Skill]) -> List[Employee]:
        """Find employees with specific skills."""
        return [emp for emp in employees if emp.can_help_with(required_skills)]


if __name__ == "__main__":
    # Test employee creation
    factory = EmployeeFactory()
    all_employees = factory.create_all_employees()

    print(f"\n🏢 Created {len(all_employees)} employees")
    print("\nTeam breakdown:")
    for team in Team:
        count = len(factory.get_team_members(all_employees, team))
        if count > 0:
            print(f"  • {team.value}: {count} members")
