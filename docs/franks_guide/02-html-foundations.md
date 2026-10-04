# 02: HTML Foundations

> The foundation of every webpage since 1995

## What HTML Is

HTML = **HyperText Markup Language**
- Purpose: Display text content on the web
- Same basic structure since 1995
- No styling, no interactions - just content

## The Basic Structure

Every HTML page has the same skeleton:

```html
<!DOCTYPE html>
<html>
<head>
    <!-- Page info (not visible) -->
</head>
<body>
    <!-- Content (what users see) -->
</body>
</html>
```

## Essential Tags You Need

| Tag | Purpose | Example |
|-----|---------|---------|
| `<h1>` | Main heading | `<h1>My Blog</h1>` |
| `<h2>` | Subheading | `<h2>About Me</h2>` |
| `<p>` | Paragraph | `<p>This is text</p>` |
| `<strong>` | Bold text | `<strong>Important</strong>` |
| `<em>` | Italic text | `<em>Emphasis</em>` |

## Your Mission

Create `index.html` and build this structure step by step:

1. HTML skeleton (html, head, body)
2. One `<h1>` heading
3. Two `<h2>` subheadings  
4. Three `<p>` paragraphs
5. Use `<strong>` and `<em>` somewhere

## Example to Build

```html
<!DOCTYPE html>
<html>
<head>
    <title>My First Page</title>
</head>
<body>
    <h1>Welcome to My Blog</h1>
    
    <p>This is my <strong>first</strong> HTML page. It's simple but it works!</p>
    
    <h2>About This Site</h2>
    <p>Here I'll share my thoughts about web development and other <em>interesting</em> topics.</p>
    
    <h2>Getting Started</h2>
    <p>HTML is the foundation of the web. Every website starts here.</p>
</body>
</html>
```

## Test It

1. Save as `index.html`
2. Double-click the file
3. It opens in your browser
4. You see formatted text!

## The Goal

**Build confidence with HTML basics.**

With practice, you'll be able to:
- Create HTML structure quickly (5-10 minutes)
- Remember common tags without looking them up  
- Format text with confidence
- Save and view in browser

## Why This Matters

- Every framework generates HTML
- Understanding HTML = understanding how browsers work
- This structure hasn't changed in 30 years
- Master this, everything else builds on top

## Common Mistakes & Solutions

**Forgetting closing tags:**
```html
<!-- Wrong -->
<p>This paragraph has no end
<h2>Next heading</h2>

<!-- Right -->
<p>This paragraph is properly closed</p>
<h2>Next heading</h2>
```

**Missing DOCTYPE:**
```html
<!-- Wrong - no DOCTYPE -->
<html>
<head>...</head>

<!-- Right -->
<!DOCTYPE html>
<html>
<head>...</head>
```

**File not opening in browser?**
- Make sure file ends with `.html`
- Save the file before opening
- Use File → Open in your browser

## AI Practice

Ask ChatGPT/Claude:
- "Give me 5 different HTML practice exercises"
- "Check my HTML structure - is this correct?"
- "What other basic HTML tags should I learn next?"

## Memory Test

**Can you create a basic HTML page from memory?**

Close this guide and create a new `test.html` file with:
- Proper HTML structure: `html > head + body`
- Title in the head
- h1 with your name
- p with a short description
- No looking at references!

**Success criteria:**
- ✅ File opens in browser without errors
- ✅ Has proper HTML5 structure
- ✅ Contains title, h1, and p elements
- ✅ Written entirely from memory

*If you can do this confidently, you've mastered HTML basics!*

## Next Up

03-css-styling.md

---

*Goal achieved when you can create a basic HTML page comfortably, with minimal reference checking*
