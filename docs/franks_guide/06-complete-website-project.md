# 06: Complete Website Project

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
                
                // Replace with your chosen API
                const response = await fetch('https://api.quotable.io/random');
                const data = await response.json();
                
                // Display the data
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

**index.html:**
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

**css/styles.css:**
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

.loading {
    text-align: center;
    color: #666;
}
```

**js/script.js:**
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

## Your Mission

**Build a complete, professional-looking website that:**
- Fetches real data from an API
- Has proper folder structure
- Looks good on mobile and desktop
- Handles loading and error states
- Is deployed and accessible online

## AI Practice

Ask ChatGPT/Claude:
- "Give me 5 free APIs I can use for beginner projects"
- "How do I make my website responsive for mobile devices?"
- "Add error handling to this fetch request: [paste your code]"
- "Help me style this API data to look more professional"

## Memory Test

**Can you build a complete website project from memory?**

Create a full website with API integration:
- Set up proper HTML structure with head and body
- Add CSS styling for a professional look
- Implement JavaScript to fetch data from an API
- Handle loading states and errors
- Test with `npx serve .`
- No looking at references!

**Success criteria:**
- ✅ Website loads and displays API data
- ✅ Has proper file organization (HTML/CSS/JS)
- ✅ Handles errors gracefully
- ✅ Built entirely from memory

*If you can build a complete API-powered website, you understand web development fundamentals!*

## Next Up

07-vue-framework-basics.md

---

*Goal achieved when you can build complete websites that fetch real data and look professional*