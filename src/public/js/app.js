// const socket = new WebSocket(`ws://${window.location.host}`)
const socket = io();

const myFace = document.getElementById("myFace")
const muteBtn = document.getElementById("mute")
const cameraBtn = document.getElementById("camera")
const camerasSelect = document.getElementById("cameras")
const roomList  =document.getElementById("roomList")

const welcome = document.getElementById("welcome")
const call = document.getElementById("call")
const roomsInStorage = JSON.parse(window.localStorage.getItem("roomList"))


let myStream;
let muted = false;
let cameraOff = false
let roomName;
let myPeerConnection;
call.hidden=true

let myDataChannel;

// 새로고침 초기 설정 localStorage 확인
if(roomsInStorage){
  const roomUl = roomList.querySelector("ul");
  roomsInStorage.forEach((room)=>{
    const li = document.createElement("li")
    li.innerText = room;
    const button = document.createElement("button")
    button.innerText = "Join Room"
    button.setAttribute('id','joinBtn')
    li.append(button)
    roomUl.append(li)
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

async function handleJoinRoom(el){
  await initCall()
  socket.emit("join_room", el)
  //아예 socket을 다른 이름으로 연결할 수 도 있지만 그냥 사용하고 방 이름이 중복되는 경우만
  //중복 제거하는 처리를 하기로 했다.
  socket.room = el
}

muteBtn.addEventListener("click", handleMuteClick)
cameraBtn.addEventListener("click", handleCameraClick)
camerasSelect.addEventListener("input", handleCameraChange)
welcomeForm.addEventListener("submit", handleWelcomeSubmit)

const joinBtn = document.getElementById("joinBtn")

//같은 id를 가진 여러 버튼의 이벤트
if(joinBtn){
  const lis = roomList.querySelectorAll("li")
  
  lis.forEach(li=>{
    const button = li.querySelector("button")
    button.addEventListener("click", ()=>handleJoinRoom(li.innerText.split("Join")[0]))
  })
}

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
  let newRooms;
  const localst = JSON.parse(window.localStorage.getItem("roomList"))
  if(rooms.length===0){
    return 
  }

  if(localst){
    newRooms = [...new Set([...localst, ...rooms])]
  }else{
    newRooms = rooms
  }
  newRooms.forEach((room)=>{
    const li = document.createElement("li")
    li.innerText = room;
    const button = document.createElement("button")
    button.innerText = "Join Room"
    button.setAttribute('id','joinBtn')
    li.append(button)
    roomUl.append(li)
  })
  
  window.localStorage.setItem("roomList", JSON.stringify(newRooms))
})

