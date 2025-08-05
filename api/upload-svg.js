const fs = require("fs");
const path = require("path");

module.exports = (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  let data = "";
  req.on("data", chunk => { data += chunk; });
  req.on("end", () => {
    if (!data.startsWith("<svg")) {
      res.status(400).json({ error: "Invalid SVG" });
      return;
    }
    // Vercel allows writing to /tmp only (ephemeral, not permanent)
    const filename = `svg-${Date.now()}.svg`;
    const filepath = path.join("/tmp", filename);
    fs.writeFileSync(filepath, data);

    // Create a link (note: file won't persist, use S3/Cloud for production)
    const url = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/get-svg?filename=${filename}`;
    res.json({ message: 'SVG uploaded', url });
  });
};
