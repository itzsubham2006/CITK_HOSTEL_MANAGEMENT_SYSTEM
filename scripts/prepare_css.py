import os

css = open('public/style.css', 'r', encoding='utf-8').read()
# Replace any local static url paths like url('/static/images/...') with url('/images/...')
css = css.replace('/static/images/', '/images/')
css = css.replace('/static/uploads/', '/images/')

header = """@import "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css";
@import "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap";

/* Reset and ensure base styles */
* {
    box-sizing: border-box;
}

body {
    font-family: 'Poppins', sans-serif;
    margin: 0;
    padding: 0;
    background-color: #f4f7f4;
    color: #333;
}

"""

with open('app/globals.css', 'w', encoding='utf-8') as f:
    f.write(header + css)

print("Successfully written app/globals.css")
