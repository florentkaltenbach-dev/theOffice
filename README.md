# theOffice

**A meta-recursive office simulation where software builds its own office and employees, then they're ready to handle projects.**

Created for: Florent
By: Nexus Software Solutions (All 47 of us!)

---

## What Is This?

**theOffice** is a Python simulation where:
1. The software constructs a complete office environment (14th floor, floor-to-ceiling windows!)
2. All 47 employees of Nexus Software Solutions are initialized with unique personalities, skills, and quirks
3. Everyone moves into their assigned workspaces
4. The office is now ready to handle customer projects!

---

## Quick Start

### Run the Office

```bash
python main.py
```

This will:
- Build the entire office (18 rooms, 99-person capacity)
- Hire all 47 employees
- Assign everyone to their workspaces
- Make the office operational!

---

## Available Commands

Once the office is running, you'll have access to a `nexus` object with these methods:

```python
# See the complete office layout
nexus.show_office_layout()

# Meet all 47 employees
nexus.show_employee_directory()

# Take a guided tour
nexus.office_tour()

# View a specific team (requires importing Team enum)
from employees import Team
nexus.show_team(Team.FRONTEND)

# Hear the reception greeting
nexus.reception_greeting()

# Start a new customer project
nexus.start_project("Project Name", "Customer Name")

# Check office status
status = nexus.status()
print(status)
```

---

## File Structure

```
theOffice/
├── main.py                 # Entry point - run this!
├── nexus.py               # Core simulation engine
├── office_builder.py      # Constructs the physical office
├── employees.py           # All 47 employees with personalities & skills
├── utils/
│   ├── display.py         # Terminal visualization
│   ├── config.py          # Configuration settings
│   └── __init__.py        # Package initialization
└── README.md              # You are here!
```

---

## The Team (All 47 of Us!)

### Leadership
- **Alexandra Morrison** - CTO
- **Diana Foster** - Director of Product Management
- **Marcus Chen** - Senior Architecture Lead

### Engineering Teams
- **Frontend Team** (6 members) - Led by Sarah Williams
- **Backend Team** (6 members) - Led by Roberto Silva
- **DevOps Team** (5 members) - Led by Kevin O'Brien
- **QA Department** (5 members) - Led by Jessica Park
- **Security Team** (4 members) - Dmitri & Vanessa leading the charge

### Other Teams
- **Design Team** (4 members) - Paulo Santos (Creative Director)
- **Data Analytics** (4 members) - Dr. James Liu
- **Product Management** (5 members) - Diana Foster's team
- **Customer Success** (5 members) - Grace, Antoine, Yuki, and more
- **Plus Bobby the Intern** (prone to breaking things, but we love him!)

---

## Special Features

### Personality System
Every employee has:
- **Skills**: Python, JavaScript, TypeScript, Design, Security, etc.
- **Personality Traits**: Detail-oriented, calm under pressure, user-focused
- **Quirks**: Roberto comments in Portuguese, Ahmed finds edge-case bugs, Katie can spot 1px misalignments

### Office Details
- **18 rooms** including conference rooms, team pods, private offices
- **Amenities**: Coffee machines, espresso bar, break room with ping pong, server room
- **Floor 14** with floor-to-ceiling windows
- **99-person capacity** (we're ready to grow!)

### Smart Assignment
The system automatically assigns employees to appropriate rooms and handles overflow with "flexible seating" warnings (realistic for growing companies!).

---

## Example Session

```python
# Run the office
python main.py

# The office builds itself, employees move in...

# Try this:
nexus.office_tour()
# Get a guided tour of the space!

nexus.start_project("API Optimization", "Acme Corp")
# Kicks off a new project with the team

from employees import Team
nexus.show_team(Team.QA)
# Meet Jessica, Ahmed, Natasha, Angela, and Creed!
```

---

## Technical Details

- **Language**: Python 3.12+
- **Platform**: Cross-platform (Windows, macOS, Linux)
- **Dependencies**: None! Pure Python standard library
- **Design Patterns**: Factory Pattern, Builder Pattern, Dataclasses
- **Type Hints**: Full type annotations throughout

---

## Credits

**Built by the entire Nexus Software Solutions team:**

- **Architecture**: Marcus Chen (train metaphors included)
- **Frontend**: Sarah Williams, Priya Patel (TypeScript types on point)
- **Backend**: Roberto Silva, Emma Chen, David Park (bilingual comments)
- **DevOps**: Kevin O'Brien, Raj Kumar, Sofia Rodriguez (backed up 3 times)
- **QA**: Jessica Park, Ahmed Hassan, Natasha Volkov (found all the bugs!)
- **Design**: Paulo Santos, Katie Lin (fixed that banner encoding issue)
- **Product**: Diana Foster (gathered all the requirements)
- **Executive**: Alexandra Morrison (approved the architecture)

**Special thanks to:**
- Ahmed for catching the Windows Unicode encoding bug
- Bobby for NOT breaking production this time
- The coffee machine for keeping us caffeinated

---

## What's Next?

The office is ready! The employees are at their stations!

Now you can:
1. Explore the office with the built-in commands
2. Start working on projects
3. Extend the system with new features
4. Add new employees or rooms
5. Build out the project management system further

**The meta-recursive loop is complete:** Software that builds its own office, populates it with employees, and is ready to build more software!

---

## License

Built with ❤️ by Nexus Software Solutions
For: Florent
Date: 2025

---

*"This is like a train that built its own station, hired its own conductors, and is now ready to take passengers to their destinations." - Marcus Chen*
