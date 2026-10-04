# 12: SQLite Database

> Make your data stick around with a real database

## The Problem

**Current state:** API data disappears when server restarts
**Solution:** Store data in a database that persists between sessions

## SQLite Terminal Quick Start

> Create a database and do basic CRUD operations in 5 minutes

### Create Database

```bash
# Create empty database file
touch mydb.db

# Open it with SQLite
sqlite3 mydb.db
```

You'll see: `sqlite>`

### Essential Commands

```sql
-- Show all tables
.tables

-- Show table structure  
.schema

-- Exit SQLite
.quit
```

### Create Table

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    age INTEGER
);
```

### CRUD Operations

#### CREATE (Insert Data)
```sql
INSERT INTO users (name, email, age) VALUES ('Alice', 'alice@email.com', 25);
INSERT INTO users (name, email, age) VALUES ('Bob', 'bob@email.com', 30);
```

#### READ (Query Data)
```sql
-- Get all records
SELECT * FROM users;

-- Get specific columns
SELECT name, age FROM users;

-- Filter results
SELECT * FROM users WHERE age > 25;
```

#### UPDATE (Modify Data)
```sql
UPDATE users SET age = 26 WHERE name = 'Alice';
```

#### DELETE (Remove Data)
```sql
DELETE FROM users WHERE name = 'Bob';
```

### Complete Example

```bash
# Create and open database
touch mydb.db
sqlite3 mydb.db
```

```sql
-- Create table
CREATE TABLE tasks (id INTEGER PRIMARY KEY, task TEXT, done BOOLEAN DEFAULT 0);

-- Add data
INSERT INTO tasks (task) VALUES ('Learn SQLite');
INSERT INTO tasks (task) VALUES ('Build an app');

-- View data
SELECT * FROM tasks;

-- Mark task as done
UPDATE tasks SET done = 1 WHERE id = 1;

-- Delete task  
DELETE FROM tasks WHERE id = 2;

-- Exit
.quit
```

That's it! You now know how to create databases and do basic CRUD operations with SQLite.

## Your Mission

**Let's build a tiny API with persistent data:**

1. **Create a database** using the terminal
2. **Build a minimal API** that reads/writes to it
3. **Test with curl** to prove data persists

### Step 1: Create Your Database

```bash
# Create database file
touch tasks.db

# Open SQLite terminal
sqlite3 tasks.db
```

```sql
-- Create a simple tasks table
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task TEXT NOT NULL,
    completed BOOLEAN DEFAULT 0
);

-- Add some test data
INSERT INTO tasks (task) VALUES ('Learn SQLite');
INSERT INTO tasks (task) VALUES ('Build API');

-- Check it worked
SELECT * FROM tasks;

-- Exit
.quit
```

### Step 2: Tiny API with Persistent Data

**Create `server.js`:**

```javascript
import express from 'express';
import Database from 'better-sqlite3';

const app = express();
app.use(express.json());

// Open database connection
const db = new Database('tasks.db');

// GET all tasks
app.get('/api/tasks', (req, res) => {
    const tasks = db.prepare('SELECT * FROM tasks').all();
    res.json(tasks);
});

// POST new task
app.post('/api/tasks', (req, res) => {
    const { task } = req.body;
    const result = db.prepare('INSERT INTO tasks (task) VALUES (?)').run(task);
    const newTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
    res.json(newTask);
});

app.listen(3000, () => {
    console.log('API running on http://localhost:3000');
});
```

**Install dependencies:**
```bash
npm init -y
npm install express better-sqlite3
```

**Start server:**
```bash
node server.js
```

### Step 3: Test with curl

**Get all tasks:**
```bash
curl http://localhost:3000/api/tasks
```

**Add a new task:**
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"task": "Test persistence"}'
```

**The Magic Moment:**
1. Add tasks via API
2. Stop server (Ctrl+C)
3. Restart server
4. Get tasks again - **they're still there!**

## Key Concepts

| Concept | Purpose | Example |
|---------|---------|---------|
| **Database File** | Stores all data permanently | `tasks.db` |
| **Table** | Organizes data in rows/columns | `tasks` table |
| **Primary Key** | Unique identifier | `id` column |
| **SQL** | Language for database operations | `SELECT * FROM tasks` |
| **Persistence** | Data survives server restarts | Tasks remain after restart |

## Why This Matters

**Before database:**
- Data in variables → disappears on restart
- No way to save user data
- API is just temporary storage

**After database:**
- Data in SQLite file → permanent storage
- User data persists between sessions
- Real application with memory

## AI Practice

Ask ChatGPT/Claude:
- "Add a 'priority' column to my tasks table"
- "How do I query incomplete tasks only?"
- "Create an API endpoint to delete tasks"
- "Show me how to update task completion status"

## Memory Test

**Can you create and use a database from memory?**

Build a complete database + API system:
- Create SQLite database with terminal commands
- Make a table with id, name, email columns
- Insert sample data using SQL
- No looking at references!

**Success criteria:**
- ✅ Database created and populated via terminal
- ✅ Built entirely from memory

*If you can build persistent APIs, you understand databases!*

## Next Up

13-final-project.md

---

*Goal achieved when you can create databases in terminal and connect them to APIs for persistent data storage*
