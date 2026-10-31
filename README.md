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

## New Movie / Web Series Push Notifications

This project now supports browser push notifications through OneSignal.

### One-time setup
1. Create a OneSignal Web Push app for your published HTTPS/GitHub Pages URL.
2. Put the OneSignal App ID in `push-config.js`.
3. Keep the OneSignal API key secret. On the Windows PC used for publishing, run once in PowerShell:
```powershell
[Environment]::SetEnvironmentVariable("MOVIEHUB_ONESIGNAL_API_KEY", "PASTE_YOUR_ONESIGNAL_APP_API_KEY", "User")
```
4. Re-open PowerShell / the publish BAT after setting the variable.
5. Publish the site.

Visitors will see an **Enable Notifications** button. Browser permission must be allowed once. After that, when a completely new movie or web series ID is added to `movies.json` and `Publish Website.bat` successfully pushes the update, the publish script sends a push notification containing that title name.

The API key is never placed in website files or GitHub. Only the public OneSignal App ID is stored in `push-config.js`.
