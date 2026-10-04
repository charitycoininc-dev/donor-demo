# 06: First Real Website

> Create a complete project using everything you've learned

## Your Mission

Build a complete website that fetches data from an API. We'll start simple with everything in one file, then organize it properly.

## Project Ideas

Pick one that excites you:
- **Quote Generator** - Display random quotes
- **Weather Dashboard** - Show current weather  
- **Movie Finder** - Search and display movies
- **Cat Photo Gallery** - Random cat pictures
- **Tech News Feed** - Latest developer news

## Step 1: Plan Your Project

**Ask ChatGPT/Claude:**
```
"I want to build a [your idea] website using HTML, CSS, and JavaScript. 
What's a good folder structure? What free APIs can I use?"
```

**Expected response time:** 1-2 seconds for AI suggestions

## Recommended Folder Structure

```
my-website/
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── script.js
├── assets/
│   ├── images/
│   └── fonts/
└── README.md
```

## Step 2: Start Simple (Single File)

Create `index.html` and build everything in one file first:

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Awesome Project</title>
    <style>
        /* All CSS here first */
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f0f0f0;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 10px;
        }
        
        .loading {
            text-align: center;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>My Project Title</h1>
        <div id="content">
            <p class="loading">Loading...</p>
        </div>
        <button id="refresh">Get New Data</button>
    </div>

    <script>
        // All JavaScript here first
        const contentDiv = document.getElementById('content');
        const refreshBtn = document.getElementById('refresh');

        async function fetchData() {
            try {
                contentDiv.innerHTML = '<p class="loading">Loading...</p>';
                
                // Example API call - replace with your chosen API
                const response = await fetch('https://api.quotable.io/random');
                const data = await response.json();
                
                // Display the fetched data
                contentDiv.innerHTML = `
                    <blockquote>
                        <p>"${data.content}"</p>
                        <cite>- ${data.author}</cite>
                    </blockquote>
                `;
            } catch (error) {
                contentDiv.innerHTML = '<p>Error loading data. Try again!</p>';
                console.error('Error:', error);
            }
        }

        // Load data when page loads
        fetchData();

        // Refresh button
        refreshBtn.addEventListener('click', fetchData);
    </script>
</body>
</html>
```

## Test Your Website

**Important:** Use HTTP serving, not file:// protocol

```bash
# In your project folder
npx serve .
```

**Then visit:** http://localhost:3000 or http://localhost:5000

**Why HTTP serving is essential:**
- APIs work properly (no CORS errors)
- JavaScript modules load correctly
- Mimics how real websites work
- Required for modern web features

**Troubleshooting:**
- If APIs don't work: Make sure you're using `npx serve .`, not opening files directly
- If serve isn't found: Install Node.js first (covered in previous lesson)

## Step 3: Introduce Fetch API

**What fetch does:** Gets data from other websites/APIs

**Basic pattern:**
```javascript
async function getData() {
    try {
        const response = await fetch('API_URL_HERE');
        const data = await response.json();
        // Use the data
        console.log(data);
    } catch (error) {
        console.error('Error:', error);
    }
}
```

**Expected console output (example):**
```javascript
{
    content: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
    length: 56
}
```

## Popular Free APIs

| API | URL | What it gives |
|-----|-----|---------------|
| **Quotes** | `https://api.quotable.io/random` | Random quotes |
| **Cat Facts** | `https://catfact.ninja/fact` | Cat facts |
| **Weather** | `https://wttr.in/Berlin?format=j1` | Weather data |
| **GitHub** | `https://api.github.com/users/YOUR_USERNAME` | Profile data |

## Step 4: Separate Your Files

Once your single file works, split it up:

**index.html** (clean structure):
```html
<!DOCTYPE html>
<html>
<head>
    <title>My Awesome Project</title>
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <div class="container">
        <h1>My Project Title</h1>
        <div id="content">
            <p class="loading">Loading...</p>
        </div>
        <button id="refresh">Get New Data</button>
    </div>
    <script src="js/script.js"></script>
</body>
</html>
```

**css/styles.css** (all styles):
```css
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f0f0f0;
}

.container {
    max-width: 800px;
    margin: 0 auto;
    background: white;
    padding: 20px;
    border-radius: 10px;
}
```

**js/script.js** (all JavaScript):
```javascript
const contentDiv = document.getElementById('content');
const refreshBtn = document.getElementById('refresh');

async function fetchData() {
    // Your fetch code here
}

fetchData();
refreshBtn.addEventListener('click', fetchData);
```

## Step 5: Polish and Deploy

**Make it look good:**
- Add colors and typography
- Make it responsive
- Add loading states
- Handle errors gracefully

**Test locally first:**
```bash
cd my-website
npx serve .
# Visit http://localhost:3000 - make sure everything works!
```

**Then deploy with Surge:**
```bash
npx surge .
```

**Common deployment issues:**
- If `npx surge` fails, try `npm install -g surge` first
- Make sure you're in the project folder
- Choose a unique domain name when prompted

## The Goal

**Build a complete, professional-looking website that:**
- Fetches real data from an API
- Has proper folder structure
- Looks good on mobile and desktop
- Handles loading and error states
- Is deployed and accessible online

## Common API Errors & Solutions

**CORS Error:**
```
Access to fetch at 'https://api.example.com' from origin 'null' has been blocked by CORS
```
**Solution:** Use APIs that support CORS, or test with a local server

**Network Error:**
- Check your internet connection
- Verify the API URL is correct
- Some APIs require API keys

**Data not displaying:**
- Check console for errors
- Verify the data structure matches your code
- Use `console.log(data)` to inspect the response

## AI-Powered Development

**Use ChatGPT/Claude for:**
```
"Help me style this website to look modern"
"What's a good color scheme for a [your theme] website?"
"How do I make this responsive?"
"Find me APIs for [your project idea]"
"Review my code - what can I improve?"
```

## Common Folder Structures

**Simple project:**
```
project/
├── index.html
├── styles.css
└── script.js
```

**Organized project:**
```
project/
├── index.html
├── css/
│   ├── styles.css
│   └── reset.css
├── js/
│   ├── script.js
│   └── utils.js
└── assets/
    └── images/
```

**Multiple pages:**
```
project/
├── index.html
├── about.html
├── css/
├── js/
├── assets/
└── pages/
```

## Import Maps (Advanced)

If you need external libraries without a build tool:

```html
<script type="importmap">
{
  "imports": {
    "lodash": "https://cdn.skypack.dev/lodash"
  }
}
</script>

<script type="module">
import _ from 'lodash';
console.log(_.capitalize('hello world')); // Output: 'Hello world'
</script>
```

## Your Action Plan

1. **Choose your project idea**
2. **Ask AI for folder structure advice**
3. **Start with single HTML file**
4. **Add fetch functionality**
5. **Split into separate files**
6. **Polish the design**
7. **Deploy with Surge**
8. **Share your creation!**

## Success Criteria

✅ **You've succeeded when:**
- Your website loads real data from an API
- Files are properly organized
- It looks professional
- It's live on the internet
- You can explain how every part works

## Memory Test

**Can you build a complete website from memory?**

Create a new project with separate files:
- `index.html` with proper structure
- `style.css` with basic styling linked to HTML
- `script.js` with API fetch code linked to HTML
- Fetch data from `https://api.quotable.io/random` and display it
- Deploy the site using a simple hosting service
- No looking at references!

**Success criteria:**
- ✅ Three separate files properly linked
- ✅ API data displays on the page
- ✅ Site is accessible online
- ✅ Built entirely from memory

*If you can build and deploy a complete website, you understand the full development process!*

## Next Up

07-vue-frameworks.md

---

*Goal achieved when you have a working website that fetches API data, organized in proper files, and deployed online*