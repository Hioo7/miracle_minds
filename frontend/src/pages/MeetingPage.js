  'use client';

  import React, { useEffect, useRef, useState } from "react";
  import { useParams } from "react-router-dom";
  import { io } from "socket.io-client";

  // STUN servers for peer connection
  const ICE_SERVERS = [
    { urls: "stun:stun.l.google.com:19302" },
    // You can add TURN servers if needed for NAT traversal
  ];

  export default function MeetingPage() {
    const { bookingId } = useParams();

    // Local state/refs
    const [socket, setSocket] = useState(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerConnectionRef = useRef(null);

    // Keep track if we are the "caller" (the first to join)
    const [isCaller, setIsCaller] = useState(false);

    useEffect(() => {
      // 1) Connect to socket.io signaling server
      const s = io("http://localhost:6000"); // or your MEETING_PORT
      setSocket(s);

      // Join the meeting room
      s.emit("join-meeting", bookingId);

      s.on("connect", () => {
        console.log("Socket connected:", s.id);
      });

      // 2) Setup event for receiving signaling messages
      s.on("webrtc-signaling", handleSignalingData);

      // Cleanup
      return () => {
        s.disconnect();
        if (peerConnectionRef.current) {
          peerConnectionRef.current.close();
        }
      };
    }, [bookingId]);

    // Once the component mounts, get local media
    useEffect(() => {
      startLocalStream();
    }, []);

    // Start local camera/mic
    const startLocalStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        // Create RTCPeerConnection
        createPeerConnection(stream);
      } catch (err) {
        console.error("Error accessing camera/mic:", err);
        alert("Could not access camera/mic. Check permissions!");
      }
    };

    // Create RTCPeerConnection and add local tracks
    const createPeerConnection = (stream) => {
      // Initialize RTCPeerConnection
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      // Store in ref so we can access in other functions
      peerConnectionRef.current = pc;

      // Add local tracks
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // On ICE candidate -> send to the other peer
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal({
            type: "candidate",
            data: event.candidate,
          });
        }
      };

      // When remote track arrives, set to remoteVideoRef
      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Check how many peers are in the room:
      // In a real scenario, you'd track room size from the server
      // For simplicity, let's assume if we are first, we are the "caller"
      // Otherwise, we wait to receive an offer
      setIsCaller(true);
    };

    // Send data via socket
    const sendSignal = (payload) => {
      // payload: { type: "offer"/"answer"/"candidate", data, ... }
      if (!socket) return;
      socket.emit("webrtc-signaling", {
        meetingId: bookingId,
        ...payload,
      });
    };

    // Handle inbound signaling messages
    const handleSignalingData = async (payload) => {
      console.log("Received signaling data:", payload);
      const { type, data } = payload;
      const pc = peerConnectionRef.current;
      if (!pc) return;

      try {
        switch (type) {
          case "offer":
            // If we get an offer, set remote desc, then create answer
            await pc.setRemoteDescription(new RTCSessionDescription(data));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            sendSignal({ type: "answer", data: answer });
            break;

          case "answer":
            // If we get an answer, set it as remote desc
            await pc.setRemoteDescription(new RTCSessionDescription(data));
            break;

          case "candidate":
            // ICE candidate
            await pc.addIceCandidate(new RTCIceCandidate(data));
            break;

          default:
            break;
        }
      } catch (error) {
        console.error("Error handling signaling data:", error);
      }
    };

    // If we are the caller, create an offer
    const handleCallPeer = async () => {
      const pc = peerConnectionRef.current;
      if (!pc) return;

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendSignal({ type: "offer", data: offer });
      } catch (err) {
        console.error("Error creating offer:", err);
      }
    };

    return (
      <div className="p-4 bg-gray-900 text-gray-200 h-screen flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Virtual Video Meeting</h1>
        <p>Meeting ID: {bookingId}</p>

        <div className="flex gap-4">
          {/* Local Video */}
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-1/2 bg-black rounded"
          ></video>

          {/* Remote Video */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-1/2 bg-black rounded"
          ></video>
        </div>

        <div>
          {/* Button to call the peer if we are the caller */}
          {isCaller && (
            <button
              onClick={handleCallPeer}
              className="mt-4 bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700"
            >
              Call Peer
            </button>
          )}
        </div>
      </div>
    );
  }
