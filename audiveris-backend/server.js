const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const fetch = require('node-fetch'); // For downloading files from URLs if needed

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Set up multer to save file with the correct extension
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Destination folder for uploaded files
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); // Get the file extension from the original filename
    cb(null, file.fieldname + "-" + Date.now() + ext); // Create a filename with the extension
  }
});

const upload = multer({ storage: storage });

// Handle PDF upload and conversion
app.post("/convert", upload.single("file"), (req, res) => {
  console.log("Received a request to convert a file.");

  if (!req.file) {
    console.error("No file uploaded.");
    return res.status(400).json({ error: "No file uploaded" });
  }

  // Log the file details
  const inputFile = path.join(__dirname, req.file.path);
  console.log(`File received. Saved at: ${inputFile}`);

  // Check if the output directory exists, create it if not
  const outputDir = path.join(__dirname, "output");
  if (!fs.existsSync(outputDir)) {
    console.log("Output directory not found, creating one.");
    fs.mkdirSync(outputDir);
  }

  // Log the conversion command
  const command = `"C:\\Program Files\\Audiveris\\bin\\Audiveris.bat" -batch -export -output "${outputDir}" "${inputFile}"`;

  console.log(`Running conversion command: ${command}`);

  // Execute the conversion
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error("Error during conversion:", stderr);
      return res.status(500).json({ error: "Conversion failed", details: stderr });
    }

    console.log("Conversion successful:", stdout);

    // Find the generated MusicXML file
    const files = fs.readdirSync(outputDir);
    const musicXMLFile = files.find(file => file.endsWith(".mxl") || file.endsWith(".xml"));

    if (!musicXMLFile) {
      console.error("No MusicXML file found after conversion.");
      return res.status(500).json({ error: "No MusicXML file found" });
    }

    console.log("MusicXML file found:", musicXMLFile);
    // res.download(path.join(outputDir, musicXMLFile), musicXMLFile);
    res.json({ fileName: musicXMLFile });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

app.get("/download/:fileName", (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(__dirname, "output", fileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  res.download(filePath, fileName);
});
