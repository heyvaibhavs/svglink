// const express = require('express');
// const bodyParser = require('body-parser');
// const fs = require('fs');
// const path = require('path');

// const app = express();
// const port = 3000;

// app.use(bodyParser.text({ type: 'image/svg+xml' })); // to accept raw SVG data

// app.use('/uploads', express.static('uploads')); // serve SVG files publicly

// // API endpoint to accept SVG data
// app.post('/upload-svg', (req, res) => {
//   const svgData = req.body;
//   if (!svgData || !svgData.startsWith('<svg')) {
//     return res.status(400).json({ error: 'Invalid SVG data.' });
//   }

//   // Generate a unique filename
//   const filename = `svg-${Date.now()}.svg`;
//   const filepath = path.join(__dirname, 'uploads', filename);

//   fs.writeFile(filepath, svgData, (err) => {
//     if (err) return res.status(500).json({ error: 'Could not save SVG file.' });

//     // Replace localhost with your domain in production
//     const fileUrl = `${req.protocol}://${req.headers.host}/uploads/${filename}`;
//     res.json({ message: 'SVG uploaded', url: fileUrl });
//   });
// });

// app.listen(port, () => {
//   console.log(`Server running at http://localhost:${port}`);
// });


const express = require('express');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.text({ type: 'image/svg+xml' }));

// 🔑 Replace these with your real keys
const supabaseUrl = 'https://alvbesuymdhckhtyplhl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsdmJlc3V5bWRoY2todHlwbGhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MTQ0NTgsImV4cCI6MjA2OTk5MDQ1OH0.L8IU3u5SJSlHmDoLL6Bt22M05VeqWZWX36p6COG5Iqo';
const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET_NAME = 'svg-uploads';

app.post('/upload-svg', async (req, res) => {
  const svgData = req.body;

  if (!svgData || !svgData.startsWith('<svg')) {
    return res.status(400).json({ error: 'Invalid SVG data.' });
  }

  const filename = `svg-${Date.now()}.svg`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filename, svgData, {
      contentType: 'image/svg+xml',
      upsert: false,
    });

  if (error) {
    console.error(error);
    return res.status(500).json({ error: 'Upload failed' });
  }

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filename);

  res.json({ message: 'SVG uploaded', url: data.publicUrl });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
