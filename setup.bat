@echo off
echo 🚀 Setting up Shotlin Doctor Assignment System on Windows...

:: Backend Setup
echo 📦 Setting up backend...
cd backend
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
npm install

:: Create directories
if not exist uploads mkdir uploads
if not exist src\controllers mkdir src\controllers
if not exist src\models mkdir src\models
if not exist src\services mkdir src\services
if not exist src\middleware mkdir src\middleware
if not exist src\routes mkdir src\routes
if not exist src\utils mkdir src\utils

:: Create .env file if it doesn't exist
if not exist .env (
    echo DATABASE_URL=mongodb://localhost:27017/shotlin_health > .env
    echo JWT_SECRET=your_super_secret_jwt_key_change_this >> .env
    echo GEMINI_API_KEY= >> .env
    echo UPLOAD_DIR=./uploads >> .env
    echo USE_GEMINI=false >> .env
    echo USE_LOCAL_OCR=true >> .env
    echo PORT=5000 >> .env
    echo NODE_ENV=development >> .env
)

cd ..

:: Frontend Setup
echo 🎨 Setting up frontend...
cd frontend
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
npm install

:: Install additional dependencies
npm install axios react-router-dom react-dropzone react-hot-toast recharts lucide-react framer-motion
npm install -D tailwindcss postcss autoprefixer @vitejs/plugin-react

:: Initialize Tailwind CSS
npx tailwindcss init -p

cd ..

echo.
echo ✅ Setup complete!
echo.
echo Next steps:
echo 1. Make sure MongoDB is installed and running
echo 2. In one terminal: cd backend ^&^& npm run dev
echo 3. In another terminal: cd frontend ^&^& npm run dev
echo 4. Run seed script: cd backend ^&^& node seed.js
echo.
echo Test Credentials:
echo Patient: patient@example.com / patient123
echo Admin: admin@shotlin.com / admin123
echo Doctor: smith@hospital.com / doctor123
echo.
pause