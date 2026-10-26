# Goteshwaraie - NISM Mock Test Platform

A comprehensive mock test system for NISM certification preparation including Securities Operations & Risk Management (SORM), Equity Derivatives, Research Analyst, Merchant Banking, Mutual Fund Distributors, and Investment Advisor.

## Features

- **6 Certifications**: Complete coverage for NISM Series XII, VIII, XV, IX, V-A, and X-A
- **49 Test Sets**: 3250 questions across all certifications
- **Real Test Environment**: Timed tests with instant results
- **Modern UI**: Clean, responsive interface built with Tailwind CSS
- **Official Explanations**: Detailed explanations for all questions
- **Practice Mode**: Learn with instant solutions and per-question feedback
- **Search Functionality**: Search across all questions by keyword
- **Custom Branding**: Fully customizable brand name and logo

## Certifications Included

1. **SORM (Series XII)** - Securities Operations & Risk Management (9 sets, 600 questions)
2. **Equity Derivatives (Series VIII)** - Options, Futures & Structured Products (9 sets, 600 questions)
3. **Research Analyst (Series XV)** - Fundamental & Technical Analysis (9 sets, 600 questions)
4. **Merchant Banking (Series IX)** - Issue Management & Underwriting (7 sets, 500 questions)
5. **Mutual Fund Distributors (Series V-A)** - Products, NAV Mechanics & Advisory (9 sets, 650 questions)
6. **Investment Advisor (Series X-A)** - Financial Planning & Advisory Services (6 sets, 300 questions)

**Total: 49 test sets, 3250 questions**

## Deployment

This project is deployed on Vercel.

### Local Development

1. Install Node.js dependencies:
```bash
cd sorm-mock-test
npm install
```

2. Start the local server:
```bash
npm start
```

The application will be available at: `http://localhost:3000`

## API Endpoints

- `GET /api/sets` - Get all available test sets
- `GET /api/questions?setId=X` - Get questions for a specific set
- `GET /api/questions?search=query` - Search questions
- `GET /api/questions?id=X` - Get specific question
- `POST /api/submit` - Submit test answers and get results

## Technical Stack

- **Backend**: Node.js serverless functions on Vercel
- **Frontend**: Vanilla JavaScript with Tailwind CSS
- **Styling**: Tailwind CSS via CDN
- **Icons**: Font Awesome
- **Deployment**: Vercel

## License

This is a personal educational project for NISM exam preparation.
