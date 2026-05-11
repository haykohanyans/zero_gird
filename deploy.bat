@echo off
echo Deploying to GitHub...
git add .
git commit -m "Update game (English version + bug fixes)"
echo Pulling latest changes from GitHub...
git pull origin main --rebase
echo Pushing to GitHub...
git push origin main
echo Done!
pause
