import { io } from "socket.io-client";

const socket = io("http://192.168.10.111:3000");

socket.on("connect", () => {
    console.log("✅ Connected to socket");
});
export function sendData(heading: number) {
    // console.log('heading: ', heading);
    try {
        socket.emit("heading_data", heading);
    } catch (e) {
        console.log("message", e);

    }
}