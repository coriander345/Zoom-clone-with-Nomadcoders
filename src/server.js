import express from "express"
import http from "http"
import WebSocket from "ws"
import {Server}from "socket.io"
import { instrument } from "@socket.io/admin-ui"

const app = express();

app.set("view engine", "pug")
app.set("views", __dirname +"/views");
app.use("/public", express.static(__dirname + "/public"))
app.get("/", (req,res)=>res.render("home"))
app.get("/*", (req,res)=>res.redirect("/"))

const serverIo = http.createServer(app);
const io = new Server(serverIo, {
  cors: {
    origin: ["http://admin.socket.io"],
    credentials: true
  }
});
instrument(io, {
  auth: false
});
// const wss = new WebSocket.Server({server})

function publicRooms(){
  const {
    sockets:{
      adapter: {sids, rooms},
    }
  }= io;
  const publicRooms=[];
  rooms.forEach((_,key)=>{
    if(sids.get(key)===undefined){
      publicRooms.push(key)
    }
  })
  return publicRooms
}

function countRoom(roomName){
  return io.sockets.adapter.rooms.get(roomName)?.size
}

io.on("connection", socket=>{
socket["nick"] = "Anon"

  socket.onAny((event)=>{
    console.log(`Socket Event: ${event}`)
  });

  socket.on("enter_room", (roomName, done)=>{
    socket.join(roomName)
      done()
    socket.to(roomName).emit("welcome", socket.nick, countRoom(roomName))
    io.sockets.emit("room_change", publicRooms())
  })

  socket.on("disconnecting", (reason) => {
    for (const room of socket.rooms) {
      if (room !== socket.id) {
        socket.to(room).emit("bye", socket.nick, countRoom(room)-1);
        
      }
    }
    socket.on("disconnect", ()=>{
      io.sockets.emit("room_change", publicRooms())
    })
    
  });

  socket.on("new_message", (msg,room,done)=>{
    socket.to(room).emit("new_message", `${socket.nick}: ${msg}`)
    done()
  })

  socket.on("nick", (nick)=>(socket["nick"] = nick))
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
serverIo.listen(3000,handleListen)
