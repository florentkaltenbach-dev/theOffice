# Written by: Sarah Williams - Frontend Team
# Assisted by: Priya Patel
# Reviewed by: Marcus Chen
# Status: Production-Ready

"""
Office Builder Module
Constructs the Nexus Software Solutions office environment on the 14th floor.
"""

from typing import Dict, List
from dataclasses import dataclass
from datetime import datetime


@dataclass
class Room:
    """Represents a room in the office."""
    name: str
    capacity: int
    amenities: List[str]
    occupied_by: List[str] = None

    def __post_init__(self):
        if self.occupied_by is None:
            self.occupied_by = []

    def __repr__(self) -> str:
        return f"Room({self.name}, capacity={self.capacity})"


class OfficeBuilder:
    """
    Builds and manages the physical office space for Nexus Software Solutions.
    14th floor, floor-to-ceiling windows, modern tech company layout.
    """

    def __init__(self):
        self.floor_number = 14
        self.rooms: Dict[str, Room] = {}
        self.common_areas: List[str] = []
        self.built = False
        self.construction_log: List[str] = []

    def log(self, message: str) -> None:
        """Log construction progress."""
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_entry = f"[{timestamp}] {message}"
        self.construction_log.append(log_entry)
        print(f"  🔨 {message}")

    def build_reception(self) -> None:
        """Build the reception area."""
        self.log("Building reception area with marble desk...")
        self.rooms["Reception"] = Room(
            name="Reception",
            capacity=5,
            amenities=["Marble Desk", "Visitor Seating", "Company Logo Wall", "Coffee Station"]
        )

    def build_conference_rooms(self) -> None:
        """Build conference rooms."""
        self.log("Constructing conference rooms...")

        conference_rooms = [
            ("Conference Room A", 12, ["Video Conferencing", "Whiteboard", "Smart Display"]),
            ("Conference Room B", 8, ["Whiteboard", "Projector", "Sound System"]),
            ("Conference Room C", 6, ["Monitor", "Whiteboard"]),
            ("The War Room", 15, ["Multiple Monitors", "Whiteboard Walls", "Coffee Machine"])
        ]

        for name, capacity, amenities in conference_rooms:
            self.rooms[name] = Room(name=name, capacity=capacity, amenities=amenities)

    def build_team_pods(self) -> None:
        """Build open team working areas."""
        self.log("Setting up team pods with ergonomic furniture...")

        team_pods = [
            ("Frontend Team Pod", 6, ["Standing Desks", "Dual Monitors", "Herman Miller Chairs"]),
            ("Backend Team Pod", 4, ["Workstations", "Multiple Monitors", "Server Access"]),
            ("DevOps Pod", 3, ["Command Centers", "Multi-Monitor Setups", "Emergency Alerts"]),
            ("QA Testing Lab", 4, ["Testing Devices", "Multiple Browsers", "Bug Tracking Screens"]),
            ("Data Analytics Suite", 3, ["High-Performance Workstations", "Large Displays", "Data Viz Tools"]),
            ("Design Studio", 3, ["iMacs", "Drawing Tablets", "Color-Calibrated Monitors"]),
        ]

        for name, capacity, amenities in team_pods:
            self.rooms[name] = Room(name=name, capacity=capacity, amenities=amenities)

    def build_private_offices(self) -> None:
        """Build private offices for leadership."""
        self.log("Constructing private offices with floor-to-ceiling windows...")

        offices = [
            ("CTO Office", 2, ["Standing Desk", "Window View", "Private Meeting Space"]),
            ("Product Director Office", 2, ["Desk", "Window View", "Whiteboard"]),
            ("Architecture Lead Office", 2, ["Standing Desk", "Multiple Whiteboards", "Model Train Set"]),
        ]

        for name, capacity, amenities in offices:
            self.rooms[name] = Room(name=name, capacity=capacity, amenities=amenities)

    def build_common_areas(self) -> None:
        """Build common areas and amenities."""
        self.log("Installing common areas and amenities...")

        common_spaces = [
            ("Kitchen", 10, ["Coffee Machines", "Espresso Bar", "Snack Bar", "Refrigerators", "Microwave"]),
            ("Break Room", 8, ["Sofas", "Gaming Console", "Board Games", "Ping Pong Table"]),
            ("Quiet Room", 4, ["Soundproofing", "Comfortable Seating", "Soft Lighting"]),
            ("Server Room", 2, ["Climate Control", "Server Racks", "Security Access", "Backup Systems"]),
        ]

        for name, capacity, amenities in common_spaces:
            self.rooms[name] = Room(name=name, capacity=capacity, amenities=amenities)
            self.common_areas.append(name)

    def install_infrastructure(self) -> None:
        """Install technical infrastructure."""
        self.log("Installing gigabit ethernet, WiFi 6, and power infrastructure...")
        self.log("Setting up climate control and LED lighting systems...")
        self.log("Installing security systems and badge access...")

    def build(self) -> None:
        """Execute full office construction."""
        if self.built:
            print("  ⚠️  Office already built!")
            return

        print("\n" + "="*70)
        print("  🏗️  NEXUS SOFTWARE SOLUTIONS - OFFICE CONSTRUCTION")
        print("  📍 14th Floor - Downtown Tech District")
        print("="*70 + "\n")

        self.build_reception()
        self.build_conference_rooms()
        self.build_team_pods()
        self.build_private_offices()
        self.build_common_areas()
        self.install_infrastructure()

        self.built = True
        self.log("Office construction COMPLETE! ✨")

        print(f"\n  📊 Total rooms built: {len(self.rooms)}")
        print(f"  👥 Total capacity: {sum(room.capacity for room in self.rooms.values())} people")
        print("="*70 + "\n")

    def get_room(self, room_name: str) -> Room:
        """Get a specific room by name."""
        return self.rooms.get(room_name)

    def assign_employee_to_room(self, employee_name: str, room_name: str) -> bool:
        """Assign an employee to a room."""
        room = self.get_room(room_name)
        if room and len(room.occupied_by) < room.capacity:
            room.occupied_by.append(employee_name)
            return True
        return False

    def get_office_layout(self) -> Dict[str, Room]:
        """Return the complete office layout."""
        return self.rooms

    def display_office(self) -> None:
        """Display a visual representation of the office."""
        print("\n" + "="*70)
        print("  🏢 NEXUS SOFTWARE SOLUTIONS - OFFICE LAYOUT")
        print("="*70 + "\n")

        categories = {
            "🚪 RECEPTION": ["Reception"],
            "🤝 CONFERENCE ROOMS": [name for name in self.rooms if "Conference" in name or "War Room" in name],
            "💻 TEAM PODS": [name for name in self.rooms if "Pod" in name or "Lab" in name or "Suite" in name or "Studio" in name],
            "👔 PRIVATE OFFICES": [name for name in self.rooms if "Office" in name],
            "☕ COMMON AREAS": self.common_areas,
        }

        for category, room_names in categories.items():
            print(f"\n{category}")
            print("-" * 70)
            for room_name in room_names:
                room = self.rooms.get(room_name)
                if room:
                    occupancy = f"{len(room.occupied_by)}/{room.capacity}"
                    print(f"  • {room.name:30} [{occupancy:>6}] - {', '.join(room.amenities[:2])}")

        print("\n" + "="*70 + "\n")


if __name__ == "__main__":
    # Test the office builder
    builder = OfficeBuilder()
    builder.build()
    builder.display_office()
