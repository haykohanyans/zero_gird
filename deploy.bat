@echo off
echo Deploying to GitHub...
git add .
git commit -m "Update game (English version + bug fixes)"
git push origin main
echo Done!
pause
