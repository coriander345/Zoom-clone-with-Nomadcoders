// const socket = new WebSocket(`ws://${window.location.host}`)
const socket = io();
// const messageList = document.querySelector("ul")
// const nickForm = document.querySelector("#nick")
// const messageForm = document.querySelector("#message")
const welcome = document.getElementById("welcome")
const form = welcome.querySelector("form");
// function makeMessage(type, payload){
//   const msg = {type, payload}
//   return JSON.stringify(msg)
// }
function handleRoomSubmit(event){
  event.preventDefault()
  const input = form.querySelector("input")
  socket.emit("enter_room", {payload: input.value}, ()=>console.log("server is done!"))
  input.value = ""
}

// function handleOpen(){
//   console.log("Connected to Server")
// }

// socket.addEventListener("open", handleOpen)

// socket.addEventListener("message", (message)=>{
//   const li = document.createElement("li")
//   li.innerText = message.data;
//   messageList.append(li)
// })

// // socket.addEventListener("close", ()=>{
// //   console.log("disconnect from server!")
// // })

// function handleSubmit(event) {
//   event.preventDefault()
//   const input = messageForm.querySelector("input");
//   socket.send(makeMessage("new_message", input.value))
//   const li = document.createElement("li")
//   li.innerText = `You: ${input.value}`;
//   messageList.append(li)
//   input.value=""
// }

// function handleNickSubmit(event){
//   event.preventDefault()
//   const input = nickForm.querySelector("input")
//   socket.send(makeMessage("nickname",input.value))
//   input.value=""
// }

// messageForm.addEventListener("submit", handleSubmit)
// nickForm.addEventListener("submit", handleNickSubmit)
form.addEventListener("submit", handleRoomSubmit)
