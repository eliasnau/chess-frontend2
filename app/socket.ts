import { io, Socket } from "socket.io-client";

const socket: Socket = io("http://localhost:8080");
// process.env.NODE_ENV === "production"
//   ? undefined
//   : "http://192.168.178.30:8080",
// {} as Partial<ManagerOptions>192.168.178.30:8080

export default socket;
