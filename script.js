const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const startCallButton = document.getElementById("startCall");
const endCallButton = document.getElementById("endCall");

let localStream;
let peerConnection;
const signalingServer = new WebSocket("ws://localhost:3000"); // WebSocket signaling server

const config = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }] // STUN server for NAT traversal
};

// Get user media (camera + mic)
async function startMedia() {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;
}

// Initialize WebRTC Peer Connection
async function startCall() {
    await startMedia();

    peerConnection = new RTCPeerConnection(config);

    // Add local stream tracks to the peer connection
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    // Handle remote stream
    peerConnection.ontrack = (event) => {
        remoteVideo.srcObject = event.streams[0];
    };

    // ICE candidate exchange
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            signalingServer.send(JSON.stringify({ type: "candidate", candidate: event.candidate }));
        }
    };

    // Create and send an offer to the remote peer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    signalingServer.send(JSON.stringify({ type: "offer", offer }));
}

// Handle WebSocket messages (signaling)
signalingServer.onmessage = async (message) => {
    const data = JSON.parse(message.data);

    if (data.type === "offer") {
        peerConnection = new RTCPeerConnection(config);
        peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        signalingServer.send(JSON.stringify({ type: "answer", answer }));
    } 
    else if (data.type === "answer") {
        peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    } 
    else if (data.type === "candidate") {
        peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    }
};

// End the call
function endCall() {
    peerConnection.close();
    localVideo.srcObject = null;
    remoteVideo.srcObject = null;
}

// Button event listeners
startCallButton.addEventListener("click", startCall);
endCallButton.addEventListener("click", endCall);
