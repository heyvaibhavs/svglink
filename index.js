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
const sharp = require('sharp');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3000;

// Middleware to handle raw SVG input
app.use(bodyParser.text({ type: 'image/svg+xml' }));

// 🔐 Supabase Setup (REPLACE THESE)
const supabase = createClient(
  'https://alvbesuymdhckhtyplhl.supabase.co',  // ✅ Your Supabase Project URL
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsdmJlc3V5bWRoY2todHlwbGhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MTQ0NTgsImV4cCI6MjA2OTk5MDQ1OH0.L8IU3u5SJSlHmDoLL6Bt22M05VeqWZWX36p6COG5Iqo'                    // ✅ Your Supabase anon public key
);
const BUCKET_NAME = 'svg-uploads'; // Your Supabase Storage bucket name

// 🔄 Upload SVG and return short link
app.post('/upload-svg', async (req, res) => {
  const svgData = req.body;

  if (!svgData || !svgData.trim().startsWith('<svg')) {
    return res.status(400).json({ error: 'Invalid SVG data' });
  }

  try {
    // 🖼️ Convert SVG → PNG (high quality)
    const pngBuffer = await sharp(Buffer.from(svgData), { density: 300 })
      .png({ quality: 100, compressionLevel: 0 })
      .toBuffer();

    const filename = `svg-${Date.now()}.png`;

    // Upload PNG to Supabase
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, pngBuffer, {
        contentType: 'image/png',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return res.status(500).json({ error: 'Upload failed' });
    }

    // Return short clean URL
    const shortUrl = `https://svglink.onrender.com/img/${filename}`;

    res.json({
      message: 'PNG uploaded',
      filename: filename,
      shortUrl: shortUrl
    });

  } catch (err) {
    console.error('Conversion error:', err);
    res.status(500).json({ error: 'Conversion failed' });
  }
});

// 📦 Short redirect route for Excel-friendly URLs
app.get('/img/:filename', async (req, res) => {
  const filename = req.params.filename;

  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filename);

  if (!data || !data.publicUrl) {
    return res.status(404).send('Image not found');
  }

  return res.redirect(data.publicUrl);
});

// ✅ Start server
app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
});


