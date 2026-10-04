# 10: Node.js Backend

> Run JavaScript anywhere - not just in browsers

## What is Node.js?

Node.js = **JavaScript runtime for your computer**
- Run JavaScript files in terminal
- Build command-line tools
- Create powerful automation scripts
- Access your file system and network

**The magic:** Same JavaScript you know, but outside the browser.

## Installing Node.js

**Check if you have Node:**
```bash
node --version
npm --version
```

**Expected output (versions may differ):**
```
v18.17.0
9.6.7
```

**If not installed:**
- Visit nodejs.org
- Download LTS version
- Install like any other program
- Installation takes 5-10 minutes

## Your First Node Script

**Create `hello.js`:**
```javascript
// hello.js
console.log('Hello from Node.js!');

const name = process.argv[2] || 'World';
console.log(`Hello, ${name}!`);

// Show all command line arguments
console.log('Arguments:', process.argv);
```

**Run it:**
```bash
node hello.js
node hello.js Frank
node hello.js 'Frank Miller'
```

**Expected output:**
```
Hello from Node.js!
Hello, World!
Arguments: [ '/usr/local/bin/node', '/path/to/hello.js' ]
```

## Fetching Data with Node

**Create `weather.js`:**
```javascript
// weather.js
async function getWeather(city = 'Berlin') {
    try {
        // Using node's built-in fetch (Node 18+)
        const response = await fetch(`https://wttr.in/${city}?format=3`);
        const weather = await response.text();
        
        console.log(`\n🌤️  Weather in ${city}:`);
        console.log(weather);
        
    } catch (error) {
        console.error('❌ Error fetching weather:', error.message);
    }
}

// Get city from command line or use default
const city = process.argv[2];
getWeather(city);
```

**Run it:**
```bash
node weather.js
node weather.js Paris
node weather.js 'New York'
```

**Expected output:**
```
🌤️  Weather in Berlin:
Berlin: ☁️  +14°C
```

## Working with Files

**Create `file-organizer.js`:**
```javascript
// file-organizer.js
import fs from 'fs';
import path from 'path';

function organizeFiles(directory = '.') {
    try {
        const files = fs.readdirSync(directory);
        const stats = {
            total: 0,
            byExtension: {}
        };
        
        files.forEach(file => {
            if (fs.statSync(file).isFile()) {
                stats.total++;
                const ext = path.extname(file).toLowerCase() || 'no extension';
                stats.byExtension[ext] = (stats.byExtension[ext] || 0) + 1;
            }
        });
        
        console.log(`\n📁 File analysis for: ${path.resolve(directory)}`);
        console.log(`📊 Total files: ${stats.total}`);
        console.log("\n📋 Files by type:");
        
        Object.entries(stats.byExtension)
            .sort(([,a], [,b]) => b - a)
            .forEach(([ext, count]) => {
                console.log(`   ${ext}: ${count} files`);
            });
            
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

const targetDir = process.argv[2];
organizeFiles(targetDir);
```

**Add to package.json:**
```json
{
    "type": "module",
    "name": "file-organizer",
    "version": "1.0.0"
}
```

**Note:** The `"type": "module"` allows using modern import/export syntax

**Run it:**
```bash
node file-organizer.js
node file-organizer.js /path/to/folder
```

## Building a Simple CLI Tool

**Create `quote-cli.js`:**
```javascript
// quote-cli.js
async function getRandomQuote() {
    try {
        const response = await fetch('https://api.quotable.io/random');
        const quote = await response.json();
        
        console.log('\n✨ Random Quote ✨');
        console.log(`\n"${quote.content}"`);
        console.log(`\n— ${quote.author}`);
        console.log(`\n📏 Length: ${quote.length} characters`);
        
    } catch (error) {
        console.error('❌ Failed to fetch quote:', error.message);
    }
}

async function getQuotesByAuthor(author) {
    try {
        const response = await fetch(`https://api.quotable.io/quotes?author=${author}&limit=3`);
        const data = await response.json();
        
        if (data.results.length === 0) {
            console.log(`\n❌ No quotes found for "${author}"`);
            return;
        }
        
        console.log(`\n📚 Quotes by ${author}:\n`);
        data.results.forEach((quote, index) => {
            console.log(`${index + 1}. "${quote.content}"`);
            console.log(`   — ${quote.author}\n`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

function showHelp() {
    console.log(`
📝 Quote CLI Tool

Usage:
  node quote-cli.js              Get random quote
  node quote-cli.js --author "Einstein"  Get quotes by author
  node quote-cli.js --help       Show this help

Examples:
  node quote-cli.js
  node quote-cli.js --author "Shakespeare"
  node quote-cli.js --author "Maya Angelou"
    `);
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
    showHelp();
} else if (args.includes('--author')) {
    const authorIndex = args.indexOf('--author') + 1;
    const author = args[authorIndex];
    if (author) {
        getQuotesByAuthor(author);
    } else {
        console.log('❌ Please provide an author name');
        showHelp();
    }
} else {
    getRandomQuote();
}
```

## API Integration Example

**Create `github-stats.js`:**
```javascript
// github-stats.js
async function getGitHubStats(username) {
    if (!username) {
        console.log('❌ Please provide a GitHub username');
        console.log('Usage: node github-stats.js <username>');
        return;
    }
    
    try {
        console.log(`\n🔍 Fetching GitHub stats for: ${username}`);
        
        // Get user info
        const userResponse = await fetch(`https://api.github.com/users/${username}`);
        if (!userResponse.ok) {
            console.log(`❌ User "${username}" not found`);
            return;
        }
        
        const user = await userResponse.json();
        
        // Get repositories
        const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`);
        const repos = await reposResponse.json();
        
        // Calculate stats
        const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
        const languages = {};
        
        repos.forEach(repo => {
            if (repo.language) {
                languages[repo.language] = (languages[repo.language] || 0) + 1;
            }
        });
        
        const topLanguages = Object.entries(languages)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);
        
        // Display results
        console.log(`\n👤 ${user.name || user.login}`);
        console.log(`📧 ${user.email || 'Email not public'}`);
        console.log(`🏢 ${user.company || 'No company listed'}`);
        console.log(`📍 ${user.location || 'Location not specified'}`);
        console.log(`\n📊 GitHub Stats:`);
        console.log(`   📚 Public repos: ${user.public_repos}`);
        console.log(`   👥 Followers: ${user.followers}`);
        console.log(`   👤 Following: ${user.following}`);
        console.log(`   ⭐ Total stars: ${totalStars}`);
        
        if (topLanguages.length > 0) {
            console.log(`\n🔥 Top Languages:`);
            topLanguages.forEach(([lang, count], index) => {
                console.log(`   ${index + 1}. ${lang}: ${count} repos`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

const username = process.argv[2];
getGitHubStats(username);
```

## Creating Your Own NPM Scripts

**package.json with custom scripts:**
```json
{
    "name": "my-node-tools",
    "version": "1.0.0",
    "type": "module",
    "scripts": {
        "weather": "node weather.js",
        "quote": "node quote-cli.js",
        "github": "node github-stats.js",
        "organize": "node file-organizer.js"
    }
}
```

**Run with npm:**
```bash
npm run weather Berlin
npm run quote -- --author "Einstein"
npm run github octocat
npm run organize
```

## Package Manager Deep Dive

**Why so many package managers exist:**

| Manager | Focus | Speed | Features |
|---------|-------|-------|----------|
| **npm** | Default, universal | Moderate | Built-in, reliable |
| **yarn** | Performance, lockfiles | Fast | Workspaces, offline |
| **pnpm** | Disk efficiency | Fastest | Shared dependencies |
| **bun** | All-in-one | Ultra-fast | Runtime + bundler |

**Try different ones:**
```bash
# npm (comes with Node)
npm install lodash

# yarn (install first: npm install -g yarn)
yarn add lodash

# pnpm (install first: npm install -g pnpm)
pnpm add lodash
```

## Advanced Script Ideas

**Ask ChatGPT/Claude to help you build:**

1. **File Backup Script**
   - "Create a Node.js script that backs up files by date"

2. **Image Resizer**
   - "Build a CLI tool that resizes images in a folder"

3. **CSV to JSON Converter**
   - "Write a Node.js script that converts CSV files to JSON"

4. **Website Monitor**
   - "Create a script that checks if websites are online"

5. **Mini ChatGPT CLI**
   - "Build a Node.js CLI that talks to OpenAI API"

## Your Mission

**Master Node.js fundamentals:**
- Run JavaScript files in terminal
- Accept command line arguments
- Fetch data from APIs
- Work with files and folders
- Build useful automation scripts
- Understand package managers

**Build these Node.js scripts to practice:**
1. **Weather CLI** - Get weather for any city
2. **File Analyzer** - Analyze folder contents
3. **API Consumer** - Fetch and display data from any API

## AI Practice

Ask ChatGPT/Claude:
- "Create a Node.js script that organizes files by extension"
- "How do I read command line arguments in Node.js?"
- "Build a CLI tool that fetches data from a weather API"
- "Convert this browser JavaScript to work with Node.js file system"

## NotebookLM Learning

**Great podcast topics:**
- "What are package managers and why are there so many?"
- "The history of Node.js and server-side JavaScript"
- "Command line tools vs web applications"

## Common Node.js Errors & Solutions

**"Cannot find module" error:**
- Check file paths are correct
- Ensure you're in the right directory
- For imports, add `.js` extension

**"fetch is not defined" (older Node versions):**
```javascript
// For Node < 18, install node-fetch:
// npm install node-fetch
import fetch from 'node-fetch';
```

**Permission errors:**
- Some operations need admin/sudo access
- Be careful with file system operations

## Real-World Script Examples

**Everyday automation ideas:**
- Auto-organize downloads folder
- Batch rename files
- Convert file formats
- Backup important folders
- Generate reports from data

## Why Node.js Matters

**Unlocks new possibilities:**
- Build command-line tools
- Automate repetitive tasks
- Process data efficiently
- Create API servers (future lessons)
- Use same language everywhere
- Massive npm ecosystem

## Practice Projects

1. **Personal Dashboard** - Fetch weather, news, GitHub activity
2. **File Organizer** - Sort files by date, type, size
3. **Data Processor** - Read CSV, process data, generate reports
4. **System Monitor** - Check disk space, memory, running processes

## Memory Test

**Can you run JavaScript with Node.js from memory?**

Create a simple Node.js script:
- Make a file called `hello.js`
- Write multiple console.log statements with different messages
- Use a variable to store your name and log it
- Create a simple function and call it
- Run the script using `node hello.js`
- No looking at references!

**Success criteria:**
- ✅ Script runs without errors
- ✅ Multiple messages appear in terminal
- ✅ Variables and functions work correctly
- ✅ Can execute Node.js commands from memory

*If you can run JavaScript outside the browser, you understand Node.js basics!*

## Next Up

11-express-apis.md

---

*Goal achieved when you understand how to run JavaScript outside the browser and can create simple command-line tools*