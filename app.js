/*jshint esversion: 6 */
const GridFsStorage = require('multer-gridfs-storage'), 
methodOverride    = require('method-override'),
bodyParser        = require('body-parser'),
mongoose          = require('mongoose'),
express           = require("express"),
crypto            = require('crypto'),
multer            = require('multer'),
Grid              = require('gridfs-stream'),
path              = require('path'),
app               = express();


// middle ware

app.use(bodyParser.urlencoded({ extended:true }));
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');

// mongoURI
const mongoURI = "mongodb://localhost/uploads";

// create mongo connection 
const conn = mongoose.createConnection(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true  });
//mongoose.connect("mongodb://localhost/uploads", { useNewUrlParser: true , useUnifiedTopology: true });
// Init gfs
 let gfs;
//  Init stream
conn.once('open', () => {
     gfs = Grid(conn.db, mongoose.mongo);
     gfs.collection('post');
 });

// var blogSchema = new mongoose.Schema({
//     title: String,
//     image: {data : Buffer, contentType: String},
//     body: String,
//     created:{type: Date, default: Date.now}
// });
// var fileI = mongoose.model("fileI", blogSchema);



// Create storage engine

const storage = new GridFsStorage({
    url: mongoURI,
    file: (req, file) => {
        return new Promise((resolve, reject) => {
          crypto.randomBytes(16, (err, buf) => {
            if (err) {
              return reject(err);
            }
            const filename = buf.toString('hex') + path.extname(file.originalname);
            const fileInfo = {
              filename: filename,
              bucketName: 'post'
            };
            resolve(fileInfo);
          });
        });
      }
    });
    const upload = multer({ storage });

// @route GET/
//@desc Loads form
app.get('/', (req, res) => {
    gfs.files.find().toArray((err, files) => {
        if(!files || files.length === 0){
            console.log(files.contentType)
            res.render('index', {files: false});
        } else {
                files.map((file) => {
                    if(
                        file.contentType === 'image/jpeg' || 
                        file.contentType === 'image/png'
                    ){
                        file.isImage = true;
                    }
                    else{
                        file.isImage = false;
                    }
                });
            res.render('index', { files: files});
        }
    }); 
});


// @route POST /upload
// @desc Uploads file

app.post('/upload', upload.single('file') , (req, res) => {
    res.redirect("/");
    //res.json({file: req.file});
});

app.get('/files', (req, res) => {
    gfs.files.find().toArray((err, files) => {
        if(!files || files.length === 0){
           return res.status(404).json({
            err: 'No Files exit'
           });
        }
        return res.json(files);
    });
});



app.get('/files/:filename', (req, res) => {
    gfs.files.findOne({filename: req.params.filename }, (err, file) => {
        if(!file || file.length === 0){
            return res.status(404).json({
                err: 'No files exist'
            });
        }
        return res.json(file);
    });
});


app.get('/image/:filename', (req, res) => {
    gfs.files.findOne({filename: req.params.filename }, (err, file) => {
        if(!file || file.length === 0){
            return res.status(404).json({
                err: 'No files exist'
            });
        }
        if(file.contentType === 'image/jpeg' || file.contentType === 'image/png'){
            const readstream = gfs.createReadStream(file.filename);
            readstream.pipe(res);
        }
        else{
            res.status(404).json({
                err: 'Not a Image'
            });
        }
    });

});

app.delete("/files/:id", (req, res) => {
    gfs.remove({_id: req.params.id, root: 'post'},(err, gridStore) => {
        if(err){
            return res.status(404).json({err: err});
        }
        res.redirect('/');
    });
});



app.listen(27017, () => {
    console.log('server has started at 27017');
});