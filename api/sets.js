// Vercel serverless function for getting test sets
module.exports = (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const sets = [
    { id: 1, name: 'Set 1', description: 'Practice Questions Set No. 1' },
    { id: 2, name: 'Set 2', description: 'Practice Questions Set No. 2' },
    { id: 3, name: 'Set 3', description: 'Practice Questions Set No. 3' },
    { id: 4, name: 'Set 4', description: 'Practice Questions Set No. 4' },
    { id: 5, name: 'Set 5', description: 'Practice Questions Set No. 5' },
    { id: 6, name: 'Set 6', description: 'Practice Questions Set No. 6' },
    { id: 7, name: 'Set 7 - Last Day Revision 1', description: 'Last Day Revision Set 1' },
    { id: 8, name: 'Set 8 - Last Day Revision 2', description: 'Last Day Revision Set 2' },
    { id: 9, name: 'Set 9 - Real Feel Timed', description: 'Real Feel Timed Test' }
  ];
  
  res.status(200).json(sets);
};
