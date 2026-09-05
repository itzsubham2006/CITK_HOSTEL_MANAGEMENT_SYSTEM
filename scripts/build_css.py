import os

os.makedirs('app', exist_ok=True)

with open('public/style.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Replace static paths to work in Next.js public/ directory
css = css.replace('/static/images/', '/images/')
css = css.replace('/static/uploads/', '/images/')
css = css.replace("url('../images/", "url('/images/")
css = css.replace('url("../images/', 'url("/images/')

header = """@import "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css";

/* Reset & Base Styles matching original CITK Flask template */
* {
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    margin: 0;
    padding: 0;
    background-color: #f4f7f4;
    color: #333;
}

a {
    color: inherit;
    text-decoration: none;
}

"""

with open('app/globals.css', 'w', encoding='utf-8') as f:
    f.write(header + css)

print("Created app/globals.css successfully with", len(css), "bytes of original CSS!")
