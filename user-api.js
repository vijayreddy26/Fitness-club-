const exp=require('express');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');
const testRouter=exp.Router();
const nodemailer=require('nodemailer');
const emailExistence=require('email-existence');
var smtpTransport = require('nodemailer-smtp-transport');
var handlebars = require('handlebars');
var fs = require('fs');
ObjectId = require('mongodb').ObjectID;

//to check whether the mail exists or not
testRouter.use(exp.json());
testRouter.post('/validEmail',(req,res,next)=>{
    emailExistence.check(req.body.email, function(error,response){
        res.send(response);
	});
});

//sending mail
var readHTMLFile = function(path, callback) {
    fs.readFile(path, {encoding: 'utf-8'}, function (err, html) {
        if (err) {
            throw err;
        }
        else {
            callback(null, html);
        }
    });
};
smtpTransport = nodemailer.createTransport(smtpTransport({
    service: 'gmail',
    secure: false,
    port: 25,
    auth: {
        user: 'abbhinav.nomulla656@gmail.com',
        pass: 'ittopbaka'
    },
    tls: {
        rejectUnauthorized: false
    }
}));

//to store image in cloudinary
const cloudinary = require("cloudinary");
const cloudinaryStorage = require("multer-storage-cloudinary");
const multer = require("multer");
//credentials
cloudinary.config({
  cloud_name: "dzb4lmyme",
  api_key: "511935753193731",
  api_secret: "7A9DTSkYf6oJZua-GGILeRsV_dg",
});
//set storage
var storage = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: "user-profiles",
  allowedFormats: ["jpg", "png"],
  filename: function (req, file, cb) {
    cb(undefined, file.fieldname + "-" + Date.now());
  }
});

//Configure multer middleware
var upload = multer({ storage: storage });

//to subscribe the user
testRouter.use(exp.json());
testRouter.post('/subscribe',(req,res,next)=>{
    let dbo=req.app.locals.dbObject.db('fitness');
    dbo.collection('subscribers').find({}).toArray((err,obj)=>{
        if(err){
            console.log(err);
            next(err);
        }
        else{
            var mail=[];
            mail=obj[0].email;
            console.log('out null',mail,obj);
            if(mail.indexOf(req.body.email)!==-1)
                res.send({message: 'already subscribed'});
            else{
                if(mail[0]=='')
                    mail[0]=req.body.email;
                else
                    mail.push(req.body.email);
                console.log(mail);
                dbo.collection('subscribers').updateOne({_id: ObjectId(obj[0]._id)},{$set: {email:mail}},(err,success)=>{
                    if(err){
                        console.log('error at user-api:',err);
                        next(err);
                    }
                    else{
                        readHTMLFile(__dirname + '/views/subscribe.html', function(err, html) {
                            var template = handlebars.compile(html);
                            var replacements = {
                                name: 'baka'
                        };
                        var htmlToSend = template(replacements);
                            var mailOptions = {
                                from: '"fitness club" <abbhinav.nomulla656@gmail.com',
                                to: req.body.email,
                                cc: 'monadarling858@gmail.com',
                                bcc:'gowthamsps98@gmail.com',
                                subject: 'Successfully Subscribed!!',
                                html : htmlToSend
                            };
                            smtpTransport.sendMail(mailOptions, function (error, response) {
                                if (error) {
                                    console.log(error);
                                    callback(error);
                                }
                                res.send({message:'success'});
                                console.log('subscription mail sent');
                            });
                        });
                    }   
                });
            }
        }
    });
});

//to register the user
testRouter.use(exp.json());
testRouter.post('/join',(req,res,next)=>{
    let dbo=req.app.locals.dbObject.db('fitness');
    console.log(req.body);
    console.log(JSON.stringify(req.body.email),typeof(JSON.stringify(req.body.email)));

    dbo.collection('users').findOne({username:req.body.username},(err,obj)=>{
        if(err){
            console.log('error at user-api:',err);
            next(err);
        }
        if(obj!=null){
            res.send({message:'user exists'});
        }
        else{
            bcrypt.hash(req.body.password,7,(err,hashedPass)=>{
                if(err){
                    next(err);
                }
                req.body.password=hashedPass;
                dbo.collection('users').insertOne(req.body,(err,sucess)=>{
                    if(err){
                        next(err);
                    }
                    res.send({message:'user created'});
                });
            });
            readHTMLFile(__dirname + '/views/join.html', function(err, html) {
                var template = handlebars.compile(html);
                var replacements = {
                     name: req.body.username
                };
                var htmlToSend = template(replacements);
                var mailOptions = {
                    from: '"fitness club" <abbhinav.nomulla656@gmail.com',
                    to: req.body.email,
                    cc: 'monadarling858@gmail.com',
                    bcc:'gowthamsps98@gmail.com',
                    subject: 'Sucessfully Joined Fitness Club!!',
                    html : htmlToSend
                 };
                smtpTransport.sendMail(mailOptions, function (error, response) {
                    if (error) {
                        console.log(error);
                        callback(error);
                    }
                    console.log('registration mail sent');
                });
            });
        }
    });
});

//to return courses of a particular user
testRouter.use(exp.json());
testRouter.post('/mycourses',(req,res,next)=>{
    let dbo=req.app.locals.dbObject.db('fitness');
    dbo.collection('users').findOne({username: req.body.username},(err,obj)=>{
        if(err){
            console.log(err);
            next(err);
        }
        else{
            dbo.collection('classes').find({}).toArray((err,objj)=>{
                if(err){
                    console.log(err);
                    next(err);
                }
                else{
                    var result=[];
                    var x=[];
                    x.push(objj);
                    var y=[];
                    y.push(obj.courses);
                    console.log('courses',obj.courses);
                    for(i of objj){
                        console.log(i._id);
                        for(j of obj.courses)
                            if(i._id==j)
                                result.push(i);
                    }
                    console.log('result');
                    for(i of result)
                        console.log(i._id);
                    res.send({message: 'success',data:result});
                }
            });
        }
    });
});

//to return details of a user
testRouter.use(exp.json());
testRouter.post('/profileRead',(req,res,next)=>{
    let dbo=req.app.locals.dbObject.db('fitness');
    
    dbo.collection('users').findOne({username:req.body.username},(err,obj)=>{
        if(err){
            console.log('error at user-api:',err);
            next(err);
        }
        else{
            res.send({message:'success',data: obj});
        }
    });
});


//to validate user during login
testRouter.use(exp.json());
testRouter.post('/login',(req,res,next)=>{
    let dbo=req.app.locals.dbObject.db('fitness');
    dbo.collection('users').findOne({username:req.body.username},(err,obj)=>{
        if(err){
            console.log('error at user-api:',err);
            next(err);
        }
        if(obj==null){
            res.send({message:'invalid username'});
        }
        else{
            bcrypt.compare(req.body.password,obj.password,(err,isMatched)=>{
                if(err){
                    next(err);
                }
                if(isMatched==false){
                    res.send({message:'invalid password'});
                }
                else{
                    jwt.sign({username:obj.username},"abcdef",{expiresIn: 604800},(err,signedToken)=>{
                        if(err){
                            next(err);
                        }
                        res.send({message:'success',token:signedToken,username:obj.username});
                    });
                }
            });
        }
    });
});


//to update about of user profile
testRouter.use(exp.json());
testRouter.post('/updateAbout', (req,res,next)=>{
    let dbo=req.app.locals.dbObject.db('fitness');

    dbo.collection('users').findOne({username: req.body.user},(err,objf)=>{
        if(err){
            console.log('error at user-api:',err);
            next(err);
        }
        if(objf==null){
            res.send({message:'invalid username'});
        }
        else{
            dbo.collection('users').updateOne({username: req.body.user},{$set: {about: req.body.about}},(err,sucess)=>{
                if(err){
                    next(err);
                }
                console.log('updated about');
                res.send({ message: 'success' });
            });
        }
    });
});

//to update the dp of user
testRouter.use(exp.json());
testRouter.post('/dpUpdate',upload.single('photo'),(req,res,next)=>{
    console.log("req body is ",req.body)
    console.log("url is ", req.file.secure_url);
    var user=req.body.user;  
    var img = req.file.secure_url;
    delete req.body.photo;
    let dbo=req.app.locals.dbObject.db('fitness');
    dbo.collection('users').updateOne({username: user},{ $set: { img: img } },(err,sucess)=>{
        if(err){
            console.log('update err',err);
            next(err);
        }
            console.log('updated dp');
            res.send({message: 'success'});
    });
});

//to update details of the user in profile page
testRouter.use(exp.json());
testRouter.post('/profileUpdate',(req,res,next)=>{
    let dbo=req.app.locals.dbObject.db('fitness');
    dbo.collection('users').updateOne({username: req.body.username},{ $set: {
        fname: req.body.fname,
        lname: req.body.lname,
        dob: req.body.dob,
        gender: req.body.gender,
        contact: req.body.contact,
        height: req.body.height,
        weight: req.body.weight,
        email: req.body.email,
        efreq: req.body.efreq,
        address: req.body.address,
        state: req.body.state,
        city: req.body.city,
        country: req.body.country,
        pincode: req.body.pincode
        } },(err,sucess)=>{
        if(err){
            console.log('update err',err);
            next(err);
        }
            console.log('updated profile');
            res.send({message: 'success'});
    });
});



//to change password of the user
testRouter.use(exp.json());
testRouter.post('/changePassword',(req,res,next)=>{
    let dbo=req.app.locals.dbObject.db('fitness');
    dbo.collection('users').findOne({username: req.body.user},(err,objf)=>{
        if(err){
            console.log('error at user-api:',err);
            next(err);
        }
        if(objf==null){
            res.send({message:'invalid username'});
        }
        else{
            console.log(req.body);

            bcrypt.compare(req.body.pass,objf.password,(err,isMatched)=>{
                if(err){
                    next(err);
                }
                if(isMatched==false){
                    res.send({ message: 'invalid password' });
                }
                else{
                    bcrypt.hash(req.body.newpass,7,(err,hashPass)=>{
                        if(err){
                            next(err);
                        }
                        dbo.collection('users').updateOne({username: req.body.user},{$set: {password: hashPass}},(err,sucess)=>{
                            if(err){
                                next(err);
                            }
                            console.log('updated pass change');
                            res.send({ message: 'success' });
                        });
                    });
                }
            });

        }
    });
});


//to send mail to user(forgot password)
testRouter.use(exp.json());
testRouter.post('/forgotpass',(req,res,next)=>{
    let dbo=req.app.locals.dbObject.db('fitness');
    console.log('inside forgotpass',req.body.username);
    dbo.collection('users').findOne({username: req.body.username},(err,objf)=>{
        if(err){
            console.log('error at user-api:',err);
            next(err);
        }
        if(objf==null){
            res.send({message:'invalid username'});
        }
        else{
            var fcode=Math.random().toString(36).slice(2);
            console.log(fcode);
            bcrypt.hash(fcode,7,(err,hashedPass)=>{
                if(err){
                    console.log('bcrypt shit');
                    next(err);
                }
                dbo.collection('users').updateOne({username: objf.username},{$set: {password: hashedPass}},(err,sucess)=>{
                    if(err){
                        next(err);
                    }
                    console.log('updated forgot pass');
                });
            });
            readHTMLFile(__dirname + '/views/forgotpass.html', function(err, html) {
                var template = handlebars.compile(html);
                var replacements = {
                     name: objf.username,
                     uname: objf.username,
                     code: fcode
                };
                var htmlToSend = template(replacements);
                var mailOptions = {
                    from: '"fitness club" <abbhinav.nomulla656@gmail.com',
                    to: objf.email,
                    cc: 'monadarling858@gmail.com',
                    bcc:'gowthamsps98@gmail.com',
                    subject: 'Temporary Password to your Fitness Club account',
                    html : htmlToSend
                 };
                smtpTransport.sendMail(mailOptions, function (error, response) {
                    if (error) {
                        console.log(error);
                        callback(error);
                    }
                    res.send({message:'success'})
                    console.log('temporary password mail sent');
                });
            });
        }
    });
});


//to post blog by user
testRouter.use(exp.json());
testRouter.post('/postBlog',upload.single('blog'),(req,res,next)=>{
    console.log("req body is ",req.body)
    console.log("url is ", req.file.secure_url);
    var image = req.file.secure_url;
    delete req.body.blog;
    let dbo=req.app.locals.dbObject.db('fitness');
    dbo.collection('blogs').insertOne({username: req.body.user,
        title: req.body.title,
        subtitle: req.body.subtitle,
        story: req.body.story,
        img: image,
        date: req.body.date },(err,sucess)=>{
        if(err){
            console.log('update err',err);
            next(err);
        }
        else{
            console.log('blog posted');
            res.send({message: 'success'});
        }
    });
});

//to get blog data
testRouter.use(exp.json());
testRouter.post('/getBlogs',(req,res,next)=>{
    let dbo=req.app.locals.dbObject.db('fitness');
    dbo.collection('blogs').find({}).toArray((err,obj)=>{
        if(err)
            next(err);
        else{
            res.send({message: 'success',data: obj});
        }
    });
});


//to get blog data by id
testRouter.use(exp.json());
testRouter.post('/getBlogById',(req,res,next)=>{
    let dbo=req.app.locals.dbObject.db('fitness');
    dbo.collection('blogs').findOne({_id:ObjectId(req.body.id)},(err,obj)=>{
        if(err) 
         console.log(err);
         else
         {
             console.log(obj);
            res.send({message:"success",data:obj});
         }

    });
});


//to post classes
testRouter.use(exp.json());
testRouter.post('/postClass',upload.single('classes'),(req,res,next)=>{
    
    var image = req.file.secure_url;
    delete req.body.classes;
    let dbo=req.app.locals.dbObject.db('fitness');
    dbo.collection('classes').insertOne({img: image,
        title: req.body.title,
        shortdescription: req.body.shortdescription,
        maingoal: req.body.maingoal,
        img: image,
        workouttype:req.body.workouttype,
        coursetype:req.body.coursetype,
        traininglevel:req.body.traininglevel,
        programduration:req.body.programduration,
        daysperweek:req.body.daysperweek,
        timeperworkout:req.body.timeperworkout,
        equipmentrequired:req.body.equipmentrequired,
        targetgender:req.body.targetgender,
        workoutplan:req.body.workoutplan,
        users:[],
        date: req.body.date },(err,sucess)=>{
        if(err){
            console.log('update err',err);
            next(err);
        }
        else{
            console.log('class posted');
            res.send({message: 'success'});
        } 
});
});

//to get all courses data
testRouter.use(exp.json());
testRouter.post('/getClass',(req,res,next)=>{
    let dbo=req.app.locals.dbObject.db('fitness');
    dbo.collection('classes').find({}).toArray((err,obj)=>{
        if(err)
            next(err);
        else{
            res.send({message: 'success',data: obj});
        }
    });

})


//to get course data by id
testRouter.use(exp.json());
testRouter.post('/getClassbyId',(req,res,next)=>{
    let dbo=req.app.locals.dbObject.db('fitness');
    dbo.collection('classes').findOne({_id:ObjectId(req.body._id)},(err,obj)=>{
        if(err) 
         console.log(err);
        else
        {
            res.send({message:"success",data:obj});
        }
    });
});


//to enroll to the course
testRouter.use(exp.json());
testRouter.use('/enrollClass',(req,res,next)=>{
    let dbo=req.app.locals.dbObject.db('fitness');
    dbo.collection('classes').findOne({_id:ObjectId(req.body.classobj._id)},(err,obj)=>{
      if(err)
       console.log(err)
      else
      {
          console.log(req.body.classobj.users);
        dbo.collection('classes').updateOne({_id:ObjectId(req.body.classobj._id)},{ $set: {users:req.body.classobj.users}},(err,obj1)=>{
            if(err)
            console.log(err);
            else
            {
               dbo.collection('users').findOne({username:req.body.username},(err,userobj)=>{
                   
                   if(err)
                    console.log(err);
                else
                {

                    console.log(obj.img);
                    var courses=userobj.courses;
                    console.log(courses);
                    if(courses[0]=="")
                        courses[0]=req.body.classobj._id;
                    else
                        courses.push(req.body.classobj._id);
                    dbo.collection('users').updateOne({username: req.body.username},{$set: {courses: courses}},(err,success)=>{
                        if(err)
                            next(err);
                        else{
                            console.log('courses',courses);
                        }
                    });
                    readHTMLFile(__dirname + '/views/register.html', function(err, html) {
                        var template = handlebars.compile(html);
                        var replacements = {
                             name:userobj.username,
                             coursename:obj.title,
                             image: obj.img
                        };
                        //console.log(replacementscoursename)
                        var htmlToSend = template(replacements);
                        var mailOptions = {
                            from: '"fitness club" <abbhinav.nomulla656@gmail.com',
                            to: userobj.email,
                            cc: 'monadarling858@gmail.com',
                            bcc:'gowthamsps98@gmail.com',
                            subject: 'Sucessfully Registered for the course!!',
                            html : htmlToSend
                         };
                        smtpTransport.sendMail(mailOptions, function (error, response) {
                            if (error) {
                                console.log(error);
                                callback(error);
                            }
                            console.log('registration mail sent');
                        });
                    });
                }
               });
                res.send({message:"success"});
            }
        });
      }
    });
    });




//if there is any logical errors in code
testRouter.use((err,req,res,next)=>{
    res.send({message:err.message});
});

module.exports=testRouter;