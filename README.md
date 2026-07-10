# Free Movie Download Static Site

Ye static website hai. Isme login, payment, backend kuch nahi hai. Pehle local test karo, fir GitHub Pages par upload karo.

## Local Test Commands

Option 1 - Python:
```bash
cd C:\Users\Motisons\OneDrive\Desktop\free-movie-site
python -m http.server 8000
```
Open:
```text
http://localhost:8000
```

Option 2 - VS Code Live Server extension se `index.html` open karo.

## Movie Add/Edit Kaise Kare

`movies.json` file open karo aur title, poster, description, quality, size, downloadUrl update karo.

Poster image ko `assets/posters/` folder me rakho aur movies.json me path do:
```json
"poster": "assets/posters/my-poster.jpg"
```

Download link me Google Drive / OneDrive link paste karo:
```json
"downloadUrl": "https://drive.google.com/..."
```

## GitHub Pages Later

```bash
git init
git add .
git commit -m "free movie site"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/free-movie-site.git
git push -u origin main
```

GitHub me:
Repo > Settings > Pages > Deploy from branch > main > /root > Save

Important: sirf owned/licensed/public-domain content ke links share karein.
