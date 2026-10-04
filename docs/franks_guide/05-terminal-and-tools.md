# 05: Terminal & Tools

> Navigate your computer and install software like a developer

## What the Terminal Is

Terminal = **Command Line Interface**
- Purpose: Control your computer with text commands
- Faster than clicking through folders
- Gateway to package managers and dev tools

## Essential Navigation Commands

| Command | Purpose | Example |
|---------|---------|---------|
| `ls` | List files/folders | `ls` |
| `cd` | Change directory | `cd Documents` |
| `mkdir` | Make folder | `mkdir my-project` |
| `touch` | Create file | `touch index.html` |
| `cat` | View file content | `cat index.html` |
| `pwd` | Show current path | `pwd` |

## Navigation Shortcuts

| Shortcut | Meaning | Example |
|----------|---------|---------|
| `~` | Home folder | `cd ~` |
| `.` | Current folder | `cd .` |
| `..` | Parent folder | `cd ..` |
| `/` | Root directory | `cd /` |

## Package Managers

**What they are:** Tools to install software easily

| Platform | Package Manager | Example |
|----------|----------------|---------|
| **Mac** | Homebrew | `brew install node` |
| **Windows** | Scoop | `scoop install nodejs` |
| **Linux** | apt | `apt install nodejs` |
| **Node.js** | npm | `npm install -g surge` |

## Installing Your First Package

**Mac users:**
```bash
# Install Homebrew first (if not already installed)
# This takes about 5-10 minutes
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Then install Node.js
brew install node
```

**Windows users:**
```bash
# Install Scoop first (if not already installed)
# Run in PowerShell as Administrator
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Then install Node.js
scoop install nodejs
```

**Note:** If you encounter errors, visit nodejs.org and download the installer directly.

## Your Mission

Learn terminal basics and deploy a website:

1. Navigate folders with terminal
2. Create project structure
3. Install Node.js (if needed)
4. Install Surge for deployment
5. Deploy your HTML project

## Practice Workflow

```bash
# Navigate to home
cd ~

# Create project folder
mkdir my-terminal-website
cd my-terminal-website

# Create files
touch index.html
mkdir css
mkdir js

# Check structure
ls
```

## Deploy with Surge

**Install Surge globally:**
```bash
npm install --global surge
```

**Create simple HTML:**
```html
<!DOCTYPE html>
<html>
<head>
    <title>My Terminal Project</title>
</head>
<body>
    <h1>Built with Terminal!</h1>
    <p>I created this using command line tools.</p>
</body>
</html>
```

## Local Development vs Deployment

**Two important concepts every developer needs:**

### **Local Development** - Testing on Your Computer
```bash
# Serve files locally with HTTP (not file://)
npx serve .
# Visit: http://localhost:3000 or http://localhost:5000
```

**Why HTTP serving matters:**
- APIs work properly (no CORS issues)
- JavaScript modules load correctly
- Mimics real website behavior
- Essential for modern web development

### **Deployment** - Publishing to the Web
```bash
# Deploy to the internet
npx surge .
# Follow prompts, get live URL that anyone can visit!
```

**The Professional Workflow:**
1. **Build** → Create your HTML/CSS/JS files
2. **Serve** → Test locally with `npx serve .`
3. **Deploy** → Publish with `npx surge .`

## Your Mission

**Master terminal navigation and web development workflow:**

- Use terminal for basic file operations
- Understand what package managers do
- Install software via command line
- Create folder structures
- **Serve websites locally** with `npx serve .`
- **Deploy websites publicly** with `npx surge .`

## Package Manager Benefits

**Why developers use them:**
- Install software without visiting websites
- Keep software updated easily
- Install development tools quickly
- Manage dependencies automatically

## Recommended Tools

**Warp Terminal** (warp.dev)
- AI-powered terminal
- Ask questions in plain English
- Perfect for beginners

## Complete Example

From zero to deployed website:

```bash
# 1. Setup project
cd ~
mkdir terminal-web-test
cd terminal-web-test

# 2. Create basic structure
touch index.html
echo '<h1>Hello Terminal!</h1>' > index.html

# 3. Check what we made
ls
cat index.html

# 4. Test locally (HTTP serving)
npx serve .
# Visit http://localhost:3000 in your browser
# Press Ctrl+C to stop server

# 5. Deploy to the web
npx surge .
# Follow prompts, get live URL!
```

**Practice the complete workflow:**
1. Create a project with this structure using only terminal commands:
```
my-website/
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── script.js
└── images/
```
2. **Test locally** with `npx serve .`
3. **Deploy to the web** with `npx surge .`
4. Use package managers to install software

## AI Practice

Ask ChatGPT/Claude:
- "What are the most important terminal commands for web developers?"
- "How do I organize files for a web project using the command line?"
- "Help me understand what `cd ..` and `cd ~` do differently"
- "What are some terminal shortcuts that will make me more productive?"

## Memory Test

**Can you navigate the terminal from memory?**

Close this guide and complete these terminal tasks:
- Make a new folder called `web-test` (mkdir)
- Navigate into that folder (cd)
- Create 3 files: `index.html`, `style.css`, `script.js` (touch)
- List all files to confirm they exist (ls)
- Go back to parent directory (cd ..)
- No looking at references!

**Success criteria:**
- ✅ Folder created successfully
- ✅ All 3 files exist in the folder
- ✅ Can navigate in and out of directories
- ✅ Commands executed entirely from memory

*If you can navigate confidently with the terminal, you've mastered the basics!*

## Next Up

06-complete-website-project.md

---

*Goal achieved when you're comfortable with basic terminal navigation and can deploy a simple website*