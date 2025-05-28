const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const fetch = require('node-fetch');

const app = express();
const port = 3000;


const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

app.use(cors());
app.use(express.json());


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + Date.now() + ext);
  }
});

const upload = multer({ storage: storage });


app.post("/convert", upload.single("file"), (req, res) => {
  console.log("Received a request to convert a file.");

  if (!req.file) {
    console.error("No file uploaded.");
    return res.status(400).json({ error: "No file uploaded" });
  }


  const inputFile = path.join(__dirname, req.file.path);
  console.log(`File received. Saved at: ${inputFile}`);


  const outputDir = path.join(__dirname, "output");
  if (!fs.existsSync(outputDir)) {
    console.log("Output directory not found, creating one.");
    fs.mkdirSync(outputDir);
  }


  const command = `"C:\\Program Files\\Audiveris\\bin\\Audiveris.bat" -batch -export -output "${outputDir}" "${inputFile}"`;

  console.log(`Running conversion command: ${command}`);


  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error("Error during conversion:", stderr);
      return res.status(500).json({ error: "Conversion failed", details: stderr });
    }

    console.log("Conversion successful:", stdout);


    const files = fs.readdirSync(outputDir);
    const musicXmlFiles = files.filter(file => file.endsWith(".mxl") || file.endsWith(".xml"));

    if (musicXmlFiles.length === 0) {
      console.error("No MusicXML file found after conversion.");
      return res.status(500).json({ error: "No MusicXML file found" });
    }


    musicXmlFiles.sort((a, b) => {
      const aTime = fs.statSync(path.join(outputDir, a)).mtime;
      const bTime = fs.statSync(path.join(outputDir, b)).mtime;
      return bTime - aTime;
    });


    const musicXMLFile = musicXmlFiles[0];

    if (!musicXMLFile) {
      console.error("No MusicXML file found after conversion.");
      return res.status(500).json({ error: "No MusicXML file found" });
    }

    console.log("MusicXML file found:", musicXMLFile);
    res.json({ fileName: musicXMLFile });
  });
});

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
