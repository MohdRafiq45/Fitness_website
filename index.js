var express = require("express");
var logger = require("morgan");
const engine = require('consolidate');
const fs = require('fs');
const bodyParser = require("body-parser");
const port = 800;
const io = require('socket.io')(8000,{
  cors: {
      origin: '*',
  }
});
const memberModel = require('./models/memberModel');

const users = {};
var topic_socketid = {}

// const sql = require('./utils/connectDb');
io.on('connection',socket=>{
  //chat sockets
  socket.on('new-user-joined',(name,titleId)=>{
      // dbtopic = topic.replace(/[^a-z0-9]/gi,'').slice(0,64);
      // con.query(`SELECT * FROM ${dbtopic}`, function (err, result, fields) {
      //     if (err) {
      //         con.query(`create table ${dbtopic}(userName varchar(255), message text)`,function(err){
      //            console.log(err);
      //         })
      //     }
      //    else{socket.emit('load',result);}
      //   });
      memberModel.chat_new_user_joined(titleId,(result)=>{socket.emit('load',result);},()=>{
        console.log(name,titleId)
        users[socket.id] = name;
        if(topic_socketid[titleId]==undefined){
            let temp = new Array()
            temp.push(socket.id);
            topic_socketid[titleId]=temp 
        }
        else{
            topic_socketid[titleId].forEach(element=>{socket.broadcast.to(element).emit('user-joined',name)})
            topic_socketid[titleId].push(socket.id);
        }
        // console.log("here is th topic list",topic_socketid);
        // console.log(name,titleId)
      })
    socket.on('send', (message,topicId)=>{
        topic_socketid[topicId].forEach(element => {socket.broadcast.to(element).emit('receive',{message: message, name: users[socket.id]});});
        memberModel.chat_update(topicId,users,socket.id,message)
      })
      
  });

  //todo sockets
  socket.on('addTask',(name,task,writer)=>{
      memberModel.addTaskTodo(name,task,'incomplete',writer);
  })

  socket.on('flipState',(name,task)=>{
    memberModel.flipStateTodo(name,task);
  })

  socket.on('removeTask',(name,task)=>{
    console.log("kjhjhklkhjh")
    memberModel.removeTaskTodo(name,task);
})
})

var memberRouter = require("./routes/member.routes.js");
var trainerRouter = require("./routes/trainer.routes.js");
var adminRouter = require("./routes/admin.routes.js");
const { type } = require("os");
const { title } = require("process");
// console.log(typeof(memberRouter));

var app = express();

// app.use(logger("dev"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// routing
app.use("/member", memberRouter);
app.use("/trainer", trainerRouter);
app.use("/admin", adminRouter);
app.use('/static',express.static('static'));
app.use(express.urlencoded());

// app.set('view engine','pug');
// app.set('views',path.join(__dirname,'views'));
app.set('views', __dirname + '/views');
app.engine('html', engine.mustache);
app.set('view engine', 'ejs');

//landing page
app.get('/',(req,res)=>{
    // res.status(200).sendFile('D:\\lab\\SE\\prog\\main_prog1\\views\\landing.html');
    // res.status(200).render('home.pug');
    res.render('landing')
});
// app.get('/member',(req,res)=>{
//   // res.status(200).sendFile('D:\\lab\\SE\\prog\\main_prog1\\views\\user1.html');
//   res.redirect('/member/getDetails');
// })
// app.get('/company',(req,res)=>{
//   res.status(200).send("company");
// })
// app.get('/admin',(req,res)=>{
//   res.status(200).send("admin");
// })

// app.get('/member/getDetails',(req,res)=>{
//   res.status(200).json({name:'abdur',age:20});
// })

// app.get('/user',(req,res)=>{
//   // console.log("gere",req.body);
//   // // res.status(200).sendFile('D:\\lab\\SE\\prog\\main_prog1\\views\\test.html');
//   // res.status(200).send(req.body.name +"\n"+ req.body.password +"\n"+ req.body.loginType);
  
// })

// app.get('/logins',(req,res)=>{
//   res.status(200).sendFile('D:\\lab\\SE\\prog\\main_prog1\\views\\landing.html');
// })

// catch 404 and forward to error handler
app.use(function (req, res, err) {
  res.status(err.status || 404).json({
    message: "No Such Route Exists",
  });
});

// error handler
app.use(function (err, req, res, next) {
  res.status(err.status || 500).json({
    message: "Error Message",
  });
  console.log(err);
});

const serv = app.listen(port,()=>{
  console.log("App started and listening");
});
module.exports = serv;
