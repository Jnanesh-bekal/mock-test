# Vercel Deployment Guide

## Prerequisites
- Vercel account (https://vercel.com)
- Git repository (GitHub, GitLab, or Bitbucket)

## Deployment Steps

### 1. Push to Git Repository
```bash
cd sorm-mock-test
git init
git add .
git commit -m "Initial commit - SORM Mock Test System"
git remote add origin <your-git-repo-url>
git push -u origin main
```

### 2. Deploy to Vercel

#### Option A: Using Vercel CLI
```bash
npm install -g vercel
vercel login
vercel
```

#### Option B: Using Vercel Dashboard
1. Go to https://vercel.com/new
2. Import your Git repository
3. Configure project settings:
   - **Framework Preset**: Other
   - **Root Directory**: `./`
   - **Build Command**: (leave empty)
   - **Output Directory**: `public`
4. Click "Deploy"

### 3. Environment Variables (if needed)
No environment variables required for this project.

### 4. Verify Deployment
- Vercel will provide a URL like: `https://sorm-mock-test.vercel.app`
- Test all features:
  - Home page loads
  - Test sets are displayed
  - Questions load correctly
  - Search functionality works
  - Practice mode works
  - Test submission works

## Project Structure for Vercel
```
sorm-mock-test/
├── api/                    # Vercel serverless functions
│   ├── questions.js       # Questions API
│   ├── submit.js          # Submit API
│   └── sets.js            # Sets API
├── public/                # Static files
│   ├── index.html         # Main HTML
│   └── app.js             # Frontend JavaScript
├── data/                  # Data files
│   └── questions.json     # Question database
├── vercel.json           # Vercel configuration
├── package.json          # Dependencies
└── .gitignore           # Git ignore rules
```

## API Endpoints (Vercel)
- `/api/sets` - Get all test sets
- `/api/questions?setId=X` - Get questions for set X
- `/api/questions?search=query` - Search questions
- `/api/questions?id=X` - Get specific question
- `/api/submit` - Submit test answers

## Local Development
To run locally:
```bash
npm install
node server.js
```
Then open http://localhost:3000

## Troubleshooting

### Build Errors
- Ensure `data/questions.json` exists
- Check that all API files are in the `api/` directory
- Verify `vercel.json` configuration

### API Errors
- Check browser console for API call errors
- Verify API_BASE is correctly set in `public/app.js`
- Ensure data files are properly formatted

### Performance
- The 600 questions JSON file is ~755KB - should load quickly
- Consider implementing pagination if performance issues arise

## Custom Domain (Optional)
1. Go to Vercel project settings
2. Add custom domain
3. Update DNS records as instructed by Vercel

## Updates
To update the deployed version:
```bash
git add .
git commit -m "Update description"
git push
```
Vercel will automatically redeploy on push.
