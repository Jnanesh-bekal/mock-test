# SORM Mock Test System

A modern mock test system for Securities Operations & Risk Management (SORM) examination preparation. Deployed on Vercel for global access.

## Features

- **9 Complete Test Sets**: All practice test sets from Pass4Sure (600 questions total)
- **Real Test Environment**: Timed tests with 3-hour duration (same as actual exam)
- **Modern UI**: Clean, responsive interface built with Tailwind CSS
- **Instant Results**: Immediate scoring with detailed answer analysis
- **Question Navigation**: Easy navigation between questions with progress tracking
- **Randomized Questions**: Questions are shuffled for each test attempt
- **Search Functionality**: Search across all questions by keyword
- **Practice Mode**: Learn with instant solutions and feedback
- **Enhanced Navigation**: Color-coded question grid for quick access

## Deployment

This project is deployed on Vercel: `https://sorm-mock-test.vercel.app`

### Local Development

1. Install Node.js dependencies:
```bash
cd sorm-mock-test
npm install
```

2. Parse questions from HTML files (if needed):
```bash
node parser.js
```

3. Start the local server:
```bash
npm start
```

The application will be available at: `http://localhost:3000`

## Usage

1. Open the deployed URL or local server in your browser
2. Select a test set from the available options
3. Click "Start Test" to begin
4. Answer questions within the 3-hour time limit
5. Submit the test to see your results

### Additional Features

- **Search Questions**: Use the search feature to find specific topics
- **Practice Mode**: Toggle practice mode to see instant solutions
- **Question Grid**: Navigate quickly using the color-coded question numbers

## API Endpoints

- `GET /api/sets` - Get all available test sets
- `GET /api/questions?setId=X` - Get questions for a specific set
- `GET /api/questions?search=query` - Search questions
- `GET /api/questions?id=X` - Get specific question
- `POST /api/submit` - Submit test answers and get results

## Project Structure

```
sorm-mock-test/
├── api/                    # Vercel serverless functions
│   ├── questions.js       # Questions API
│   ├── submit.js          # Submit API
│   └── sets.js            # Sets API
├── public/                # Static files
│   ├── index.html         # Main HTML file
│   ├── app.js             # Frontend JavaScript application
│   └── data/              # Static data
│       └── questions.json # Question database
├── server.js             # Local Express server
├── parser.js             # HTML question parser
├── vercel.json          # Vercel configuration
├── package.json         # Node.js dependencies
└── data/                # Local data directory
    └── questions.json   # Parsed questions
```

## Test Sets Included

1. Set 1 - Practice Questions Set No. 1 (50 questions)
2. Set 2 - Practice Questions Set No. 2 (50 questions)
3. Set 3 - Practice Questions Set No. 3 (50 questions)
4. Set 4 - Practice Questions Set No. 4 (50 questions)
5. Set 5 - Practice Questions Set No. 5 (50 questions)
6. Set 6 - Practice Questions Set No. 6 (50 questions)
7. Set 7 - Last Day Revision 1 (100 questions)
8. Set 8 - Last Day Revision 2 (100 questions)
9. Set 9 - Real Feel Timed Test (100 questions)

**Total: 600 questions**

## Features Details

### Timer
- 3-hour countdown timer (10800 seconds)
- Warning animation when 5 minutes remaining
- Auto-submit when time expires

### Scoring
- Instant calculation of correct/wrong answers
- Percentage score with grade assessment
- Detailed question-by-question breakdown

### Navigation
- Previous/Next question buttons
- Question number grid for quick navigation
- Visual indication of answered questions (green = answered, purple = current)
- Progress bar showing test completion

### Search
- Search across all 600 questions
- Filter by specific test sets
- Instant results with correct answer highlighting

### Practice Mode
- Toggle between Exam Mode and Practice Mode
- Show instant solutions in Practice Mode
- Visual feedback for correct/incorrect answers

## Technical Stack

- **Backend**: Node.js serverless functions on Vercel
- **Frontend**: Vanilla JavaScript with Tailwind CSS
- **HTML Parsing**: Cheerio (for local parsing)
- **Styling**: Tailwind CSS via CDN
- **Icons**: Font Awesome
- **Deployment**: Vercel

## Deployment Instructions

See `DEPLOYMENT.md` for detailed deployment instructions.

## Notes

- The parser extracts questions from the original Pass4Sure HTML files
- Questions are shuffled randomly for each test attempt
- The system maintains a real exam-like environment
- Results are calculated instantly upon submission
- The application works both locally and on Vercel with fallback mechanisms

## Troubleshooting

If no questions appear:
1. Ensure `data/questions.json` exists and has content
2. Check that the parser ran successfully
3. Verify API endpoints are responding
4. Check browser console for errors

## License

This is a personal educational project for SORM exam preparation.
