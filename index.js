const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

app.use(bodyParser.text({ type: 'image/svg+xml' })); // to accept raw SVG data

app.use('/uploads', express.static('uploads')); // serve SVG files publicly

// API endpoint to accept SVG data
app.post('/upload-svg', (req, res) => {
  const svgData = req.body;
  if (!svgData || !svgData.startsWith('<svg')) {
    return res.status(400).json({ error: 'Invalid SVG data.' });
  }

  // Generate a unique filename
  const filename = `svg-${Date.now()}.svg`;
  const filepath = path.join(__dirname, 'uploads', filename);

  fs.writeFile(filepath, svgData, (err) => {
    if (err) return res.status(500).json({ error: 'Could not save SVG file.' });

    // Replace localhost with your domain in production
    const fileUrl = `${req.protocol}://${req.headers.host}/uploads/${filename}`;
    res.json({ message: 'SVG uploaded', url: fileUrl });
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
