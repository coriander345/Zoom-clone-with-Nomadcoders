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

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
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
      roomList.push(key)
    }
  })
  return publicRooms
}

io.on("connection", socket=>{
  
  
  socket.on("join_room", (roomName)=>{
    socket.join(roomName)
    //socket.broadcast.emit("welcome", roomName)
    socket.to(roomName).emit("welcome", roomName)
    roomList.push(roomName)
    socket.broadcast.emit("room_change", publicRooms())
  })

  socket.on("offer", (offer, roomName)=>{
    socket.to(roomName).emit("offer", offer)
  })

  socket.on("answer", (answer,roomName)=>{
    socket.to(roomName).emit("answer", answer)
  })

  socket.on("ice", (ice,roomName)=>{
    socket.to(roomName).emit("ice", ice)
  })

  socket.on("disconnect", (reason) => {
    console.log(reason)
    if(roomList.length !== 0){
     
    }
    
  });
})
const handleListen = ()=>console.log("hello")
httpServer.listen(3000,handleListen)
