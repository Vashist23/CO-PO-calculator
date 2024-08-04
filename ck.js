const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = 3000;
mongoose.connect('mongodb+srv://project:project@project.ecnoucg.mongodb.net/?retryWrites=true&w=majority')
  .then(() => {
    console.log('Connected to the database');
  })
  .catch((error) => {
    console.error('Failed to connect to the database:', error);
  });

app.use(express.json());
app.use(cors());


const excelDataSchema = new mongoose.Schema({
    fileName: {
        type: String,
        required: true
    },
    department:{
        type:String,
        
    },
    year:{
        type:String,
        
    },
    subject:{
        type:String,
        
    },
    data: {
        type: Array, 
        required: true
    }
});

const excelFileSchema = new mongoose.Schema({
    files: [excelDataSchema]
});

const ExcelFile = mongoose.model('ExcelFile', excelFileSchema);
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


app.get('/details', async (req, res) => {
    try {
      
        const details = await ExcelFile.find({});
        res.status(200).json(details);
    } catch (error) {
        console.error('Error retrieving details from the database:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/upload', upload.array('file'), async (req, res) => {
    const files = req.files;
    if (!files || files.length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    const dataObjects = [];

    files.forEach(file => {
        const workbook = xlsx.read(file.buffer, { type: 'buffer' });

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const jsonData = xlsx.utils.sheet_to_json(sheet);

        const fileObject = {
            fileName: file.originalname,
            department:file.departmentName,
            year:file.Year,
            subject:file.subjectName,
            data: jsonData
        };

        dataObjects.push(fileObject);
    });

    try {

        const excelFile = new ExcelFile({ files: dataObjects });

        await excelFile.save();

        res.status(200).json({ message: 'Files uploaded and saved to the database.' });
    } catch (error) {
        console.error('Error saving data to the database:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
