import express from "express"
import http from "http"
import WebSocket from "ws"
import SocketIO from "socket.io"
const app = express();

app.set("view engine", "pug")
app.set("views", __dirname +"/views");
app.use("/public", express.static(__dirname + "/public"))
app.get("/", (req,res)=>res.render("home"))
app.get("/*", (req,res)=>res.redirect("/"))

const server = http.createServer(app);
const io = SocketIO(server)
// const wss = new WebSocket.Server({server})

io.on("connection", socket=>{
  socket.on("enter_room", (msg, done)=>{
    setTimeout(()=>{
      done()
    },10000)
  })
});
// function onSocketMessage(message) {
  
// }

// const sockets = []

// wss.on("connection", (socket)=>{
//   sockets.push(socket)
//   socket["nickname"] = "Anon"
//   console.log("Connected to Browser")
//   socket.on("close",onSocketClose)
//   socket.on("message", (message)=>{
//     const parsed = JSON.parse(message)
//     switch (parsed.type){
//       case "new_message":
//         sockets.forEach((aSocket)=>{
//           aSocket.send(`${socket["nickname"]}:`+parsed.payload)})
//         break;
//       case "nickname":
//         socket["nickname"] = parsed.payload
      
//        break;
//       }

    

//   })
  
// })
const handleListen = ()=>console.log("hello")
server.listen(3000,handleListen)
