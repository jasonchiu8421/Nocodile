@echo off
echo Starting Nocodile Application with Docker Compose...
echo.

echo Building and starting services...
docker-compose -f docker-compose.yml up --build

echo.
echo Application started!
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:8888
echo MySQL: localhost:3306
echo.
pause
