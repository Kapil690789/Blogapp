// const express = require('express');
// const app  = express();
// const userModel = require("./models/user");
// const postModel = require("./models/post");
// const cookieParser = require('cookie-parser');
// const bcrypt  =  require('bcrypt');
// const jwt = require('jsonwebtoken');
// const { result } = require('postcss');

// app.set("view engine", "ejs");
// app.use(express.json());
// app.use(express.urlencoded({extended: true}));
// app.use(cookieParser());

// app.get('/', (req,res)=>{
//     res.render("index");
// });

// app.get('/login',(req,res)=>{
//   res.render("login");
// });

// app.get('/profile',isLoggedIn,async (req,res)=>{
//  let user =  await userModel.findOne({email: req.user,email});
//  console.log(user);
//   res.render("profile",{user});
// });

// app.post('/register',async (req,res) =>{
//     let {email,password,username,name,age} = req.body;

//     let user = await userModel.findOne({email: email});
//   if(user) return res.status(500).send("user alredy register");
  
//   bcrypt.genSalt(10,(err,salt)=>{
//     bcrypt.hash(password,salt, async (err,hash)=>{
//     let user =  await userModel.create({
//         username,
//         email,
//         age,
//         name,
//         password: hash
//       });

//    let token =   jwt.sign({email: email, userid: user._id},"shhhh");
//    res.cookie("token", token);
//    res.send("registered");
//     })
//   })
// }); 

// app.post('/login',async (req,res) =>{
//   let {email,password} = req.body;

//   let user = await userModel.findOne({email: email});
// if(!user) return res.status(500).send("something went wrong");
  

//    bcrypt.compare(password,user.password, (err,result)=>{
//      if(result) {
      
//       let token =   jwt.sign({email: email, userid: user._id},"shhhh");
//       res.cookie("token", token);
//       res.status(200).redirect("/profile");
//      }    
//      else res.redirect("/login");
//    });
// }); 

// app.get('/logout', (req,res)=>{
//   res.cookie("token","");
//   res.redirect("/login");
// });

// function isLoggedIn(req,res,next){
//    if(req.cookies.token === "") res.redirect("/login");
//    else {
//    let data =  jwt.verify(req.cookies.token,"shhhh");
//    req.user = data;
//    next();

//    }
// }

// app.listen(3000);
const express = require('express');
const app  = express();
const mongoose = require('mongoose');
const userModel = require('./models/user');
const postModel = require('./models/post');
const cookieParser = require('cookie-parser');
const bcrypt  =  require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require("crypto");
const path = require("path");
const upload  = require("./config/multerconfig");
// const multer = require('multer');


app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname,"public")));
app.use(cookieParser());


// crypto.randomBytes(12,function(err,bytes){
//     console.log(bytes.toString("hex"));
//   });
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//       cb(null, './public/images/uploads')
//     },
//     filename: function (req, file, cb) {
//         crypto.randomBytes(12,function(err,bytes){
//             // console.log(bytes.toString("hex"));
//             const fn = bytes.toString("hex") + path.extname(file.originalname)
//            cb(null, fn)
//         })
//     }
// })
  
//   const upload = multer({ storage: storage })

app.get("/", (req, res) => {
    res.render("index");
});

app.get("/profile/upload", (req, res) => {
    res.render("profileupload");
});

app.post("/upload",isLoggedIn, upload.single("image"), async (req, res) => {
  let user =  await userModel.findOne({email: req.user.email});
  user.profilepic = req.file.filename;
  await user.save();
  res.redirect("/profile");
});

app.get("/login", (req, res) => {
    res.render("login");
});
// app.get('/test', (req, res) => {
//     res.render("test");
// });
// app.get('/upload', upload.single("image"), (req, res) => {
//      console.log(req.file);
// });


// app.get('/profile', isLoggedIn, async (req, res) => {
    
//         let user = await userModel.findOne({ email: req.user.email });
//         user.populate("posts");
//         res.render("profile", { user });
    
// });
app.get('/profile', isLoggedIn, async (req, res) => {
  try {
      let user = await userModel.findOne({ email: req.user.email }).populate("posts");
      res.render('profile', { user });
  } catch (err) {
      res.status(500).send('Error fetching user profile.');
  }
});
app.get('/like/:id', isLoggedIn, async (req, res) => {
  try {
      let post = await postModel.findOne({ _id: req.params.id }).populate("user");
      if(post.likes.indexOf(req.user.userid) === -1){
        post.likes.push(req.user.userid);
      }else{
        post.likes.splice(post.likes.indexOf(req.user.userid),1);
      }
      
    //   post.likes.push(req.user.userid);
      await post.save();
      res.redirect("/profile");
  } catch (err) {
      res.status(500).send('Error fetching user profile.');
  }
});

app.get('/edit/:id', isLoggedIn, async (req, res) => {
  try {
      let post = await postModel.findOne({ _id: req.params.id }).populate("user");
      res.render("edit",{post});
  } catch (err) {
      res.status(500).send('Error fetching user profile.');
  }
});
app.post('/update/:id', isLoggedIn, async (req, res) => {
  try {
      let post = await postModel.findOneAndUpdate({ _id: req.params.id },{content: req.body.content});
      res.redirect("/profile");
  } catch (err) {
      res.status(500).send('Error fetching user profile.');
  }
});
app.post('/post', isLoggedIn, async (req, res) => {
  
      let user = await userModel.findOne({ email: req.user.email });
      let {content} = req.body;
      let post =  await postModel.create({
      user: user._id,
      content
     });

     user.posts.push(post._id);
    await user.save();
    res.redirect("/profile");

});

app.post('/register', async (req, res) => {
    let { email, password, username, name, age } = req.body;

    try {
        let user = await userModel.findOne({ email: email });
        if (user) return res.status(500).send("User already registered");

        bcrypt.genSalt(10, (err, salt) => {
            if (err) return res.status(500).send("Error during password hashing.");

            bcrypt.hash(password, salt, async (err, hash) => {
                if (err) return res.status(500).send("Error during password hashing.");

                let newUser = await userModel.create({
                    username,
                    email,
                    age,
                    name,
                    password: hash
                });

                let token = jwt.sign({ email: email, userid: newUser._id }, "shhhh");
                res.cookie("token", token);
                res.send("Registered");
            });
        });
    } catch (err) {
        res.status(500).send("Error during registration.");
    }
});

app.post('/login', async (req, res) => {
    let { email, password } = req.body;

    try {
        let user = await userModel.findOne({ email: email });
        if (!user) return res.status(500).send("User not found");

        bcrypt.compare(password, user.password, (err, result) => {
            if (err) return res.status(500).send("Error during password comparison.");

            if (result) {
                let token = jwt.sign({ email: email, userid: user._id }, "shhhh");
                res.cookie("token", token);
                res.status(200).redirect("/profile");
            } else {
                res.redirect("/login");
            }
        });
    } catch (err) {
        res.status(500).send("Error during login.");
    }
});

app.get('/logout', (req, res) => {
    res.cookie("token", "");
    res.redirect("/login");
});

function isLoggedIn(req, res, next) {
    if (!req.cookies.token) {
        res.redirect("/login");
    } else {
        try {
            let data = jwt.verify(req.cookies.token, "shhhh");
            req.user = data;
            next();
        } catch (err) {
            res.redirect("/login");
        }
    }
}

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
