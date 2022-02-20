// const socket = new WebSocket(`ws://${window.location.host}`)
const socket = io();

const myFace = document.getElementById("myFace")
const muteBtn = document.getElementById("mute")
const cameraBtn = document.getElementById("camera")
const camerasSelect = document.getElementById("cameras")
const roomList  =document.getElementById("roomList")

const welcome = document.getElementById("welcome")
const call = document.getElementById("call")
const joinBtn = document.getElementById("joinBtn")
console.log(joinBtn)
call.hidden=getLocalStorage("call")

const roomNames = JSON.parse(window.localStorage.getItem("roomList"))

window.localStorage.setItem("call_hidden", true)
window.localStorage.setItem("welcome_hidden", false)

let myStream;
let muted = false;
let cameraOff = false
let roomName;
let myPeerConnection;
let myDataChannel;

function getLocalStorage(src){
  if(src === "call"){
    return JSON.parse(window.localStorage.getItem("call_hidden"))
  } else{
    return JSON.parse(window.localStorage.getItem("welcome_hidden"))
  }
}

function setLocalStorage(key, value){
  if(key === "call"){
    return window.localStorage.setItem("call_hidden", value)
  } else{
    return window.localStorage.getItem("welcome_hidden", value)
  }
}

if(roomNames){
  const roomUl = roomList.querySelector("ul");
  console.log(roomNames)
  roomNames.forEach((room)=>{
    const li = document.createElement("li")
    li.innerText = room;
    roomUl.append(li)
    const button = document.createElement("button")
    button.innerText = "Join Room"
    li.append(button)
  })
}



async function getCameras() {
  try {
    const devices  = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device)=>device.kind === "videoinput")
    const currentCamera = myStream.getVideoTracks()[0]
    cameras.forEach(camera =>{
      const option = document.createElement("option")
      option.value = camera.deviceId
      option.innerText = camera.label

      if(currentCamera.label === camera.label){
        option.selected = true
      }
      camerasSelect.appendChild(option)
    })
    /* 스트림 사용 */
  } catch(err) {
    /* 오류 처리 */
  }
}

async function getMedia(deviceId){
  
  const initialConstraints = { audio: true, video: { facingMode: "user" } }
  const cameraConstraints = { video: { deviceId: { exact: deviceId } } }

  try {
    myStream = await navigator.mediaDevices.getUserMedia(deviceId?cameraConstraints:initialConstraints);
    /* 스트림 사용 */
    myFace.srcObject = myStream
    if(!deviceId){
    await getCameras()
    }
  } catch(err) {
    /* 오류 처리 */
  }
}

function handleMuteClick(){
 
  const onMuted = myStream.getAudioTracks()[0]
  
  if(!muted){
    muteBtn.innerText = "Unmute"
    muted = true
    onMuted.enabled = false
  } else{
    muteBtn.innerText = "Mute"
    muted = false
    onMuted.enabled = true
  }
}

function handleCameraClick(){
  myStream.getVideoTracks().forEach((track)=>track.enabled= !track.enabled)
  if(cameraOff){
    cameraBtn.innerText = "Turn Camera Off"
    cameraOff = false
  } else{
    cameraBtn.innerText = "Turn Camera ON"
    cameraOff = true
  }
  
}

async function handleCameraChange(){
  await getMedia(camerasSelect.value)
  if(myPeerConnection){
    const videoTrack = myStream.getVideoTracks()[0]
  const videoSender = myPeerConnection.getSenders().find(sender=>sender.track.kind == "video")
  console.log(videoSender)
  videoSender.replaceTrack(videoTrack)
  }
}

const welcomeForm = welcome.querySelector("form")

async function initCall(){
  await getMedia()
  call.hidden=false
  welcome.hidden=true
  roomList.hidden= true
  const h3 = call.querySelector("h3")
  h3.innerText = "Room Name: "+roomName
  makeConnection()
}

async function handleWelcomeSubmit(event){
  event.preventDefault()
  const input = welcomeForm.querySelector("input")
  roomName = input.value
  await initCall()
  socket.emit("join_room", input.value)
  socket.room = roomName
  input.value=""
}

muteBtn.addEventListener("click", handleMuteClick)
cameraBtn.addEventListener("click", handleCameraClick)
camerasSelect.addEventListener("input", handleCameraChange)
welcomeForm.addEventListener("submit", handleWelcomeSubmit)


// RTC Code
function makeConnection(){
  myPeerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: [
          "stun:stun.l.google.com:19302",
"stun:stun1.l.google.com:19302",
"stun:stun2.l.google.com:19302",
"stun:stun3.l.google.com:19302",
"stun:stun4.l.google.com:19302"
        ]
      }
    ]
  })
  myPeerConnection.addEventListener("icecandidate", handleIce)
  myPeerConnection.addEventListener("addstream", handleAddStream)

  myStream.getTracks().forEach((track)=>{
    myPeerConnection.addTrack(track,myStream)
  })
}

function handleIce(data){ 
  socket.emit("ice",data.candidate, roomName)
}

function handleAddStream(data){
  const peersStream = document.getElementById("peersStream")
  peersStream.srcObject = data.stream
  
}

// Socket Code
socket.on("connect", ()=>{
  console.log(socket)
})

socket.on("welcome", async (roomName)=>{
  myDataChannel = myPeerConnection.createDataChannel("chat")
  myDataChannel.addEventListener("message", console.log)
  console.log("made data channel")
  const offer = await myPeerConnection.createOffer()
  myPeerConnection.setLocalDescription(offer)
  socket.emit("offer", offer, roomName)
  
})

socket.on("offer", async (offer)=>{
  myPeerConnection.addEventListener("datachannel", (event)=>{
    myDataChannel = event.channel;
    myDataChannel.addEventListener("message",console.log)
  })
  console.log("received the offer")
 myPeerConnection.setRemoteDescription(offer)
 const answer= await myPeerConnection.createAnswer()
 myPeerConnection.setLocalDescription(answer)
 socket.emit("answer", answer, roomName)
  console.log("sent the answer")
})

socket.on("answer", (answer,roomName)=>{
  console.log("receive the answer: " + roomName )
  myPeerConnection.setRemoteDescription(answer)
})
socket.on("ice", async (ice)=>{
  console.log("receive candidate")
  await myPeerConnection.addIceCandidate(ice)
})


socket.on("room_change", (rooms)=>{
  const roomUl = roomList.querySelector("ul");
  roomUl.innerHTML="";
  if(rooms.length===0) return 
  
  window.localStorage.setItem("roomList", JSON.stringify(rooms))
  console.log(roomNames)
  rooms.forEach((room)=>{
    const li = document.createElement("li")
    li.innerText = room;
    roomUl.append(li)
    const button = document.createElement("button")
    button.setAttribute('id','joinBtn');
    button.innerText = "Join Room"
    li.append(button)
  })
})