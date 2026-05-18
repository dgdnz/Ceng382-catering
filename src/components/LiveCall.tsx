"use client";

import { useState, useEffect, useRef } from "react";
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, ShieldAlert, Award } from "lucide-react";

interface LiveCallProps {
  orderId: string;
  callerRole: "USER" | "CATERER";
  partnerName: string;
}

export default function LiveCall({ orderId, callerRole, partnerName }: LiveCallProps) {
  const [peer, setPeer] = useState<any>(null);
  const [myPeerId, setMyPeerId] = useState("");
  const [partnerPeerId, setPartnerPeerId] = useState("");

  const [callState, setCallState] = useState<"idle" | "connecting" | "ringing" | "connected" | "ended">("idle");
  const [error, setError] = useState("");
  
  // Media controls
  const [micMuted, setMicMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const currentCallRef = useRef<any>(null);

  // Deterministic Peer IDs based on Order ID
  const USER_PEER_PREFIX = `ceng382-order-${orderId}-user`;
  const CATERER_PEER_PREFIX = `ceng382-order-${orderId}-caterer`;

  useEffect(() => {
    // Import PeerJS dynamically to prevent Next.js SSR build failures
    const initPeer = async () => {
      try {
        const { default: Peer } = await import("peerjs");

        const myId = callerRole === "USER" ? USER_PEER_PREFIX : CATERER_PEER_PREFIX;
        const partnerId = callerRole === "USER" ? CATERER_PEER_PREFIX : USER_PEER_PREFIX;

        setMyPeerId(myId);
        setPartnerPeerId(partnerId);

        // Connect to free public PeerJS cloud server
        const newPeer = new Peer(myId, {
          debug: 1,
        });

        newPeer.on("open", (id) => {
          console.log("My PeerJS ID is: " + id);
        });

        // Handle incoming call (answering)
        newPeer.on("call", async (incomingCall) => {
          setCallState("ringing");
          currentCallRef.current = incomingCall;

          if (confirm(`Incoming pastry call from ${partnerName}! Answer? 🍰`)) {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
              });

              localStreamRef.current = stream;
              if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
              }

              incomingCall.answer(stream);
              setCallState("connected");

              incomingCall.on("stream", (remoteStream: any) => {
                if (remoteVideoRef.current) {
                  remoteVideoRef.current.srcObject = remoteStream;
                }
              });
            } catch (err: any) {
              setError("Failed to access camera/microphone. Please check permissions.");
              incomingCall.close();
              setCallState("idle");
            }
          } else {
            incomingCall.close();
            setCallState("idle");
          }
        });

        newPeer.on("error", (err) => {
          console.error("PeerJS error:", err);
          if (err.type === "peer-unavailable") {
            setError(`${partnerName} is not online yet. Wait for them to open their order page!`);
          } else {
            setError("Connection issue. Please retry.");
          }
          setCallState("idle");
        });

        setPeer(newPeer);
      } catch (err: any) {
        console.error("Failed to initialize PeerJS:", err);
      }
    };

    initPeer();

    return () => {
      // Clean up media streams and peer connections on unmount
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (peer) {
        peer.destroy();
      }
    };
  }, [orderId]);

  // Initiate call
  const startCall = async () => {
    setError("");
    setCallState("connecting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const call = peer.call(partnerPeerId, stream);
      currentCallRef.current = call;

      call.on("stream", (remoteStream: any) => {
        setCallState("connected");
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      });

      call.on("close", () => {
        endCall();
      });
    } catch (err: any) {
      setError("Camera/Mic permissions required to initiate live call.");
      setCallState("idle");
    }
  };

  // Terminate call
  const endCall = () => {
    if (currentCallRef.current) {
      currentCallRef.current.close();
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    setCallState("ended");
    setTimeout(() => {
      setCallState("idle");
      setError("");
    }, 2000);
  };

  // Toggle Mute Audio
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle Video Camera
  const toggleCam = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCamOff(!videoTrack.enabled);
      }
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-primary border-opacity-35 shadow-xl max-w-2xl mx-auto space-y-6">
      
      {/* Header Info */}
      <div className="flex justify-between items-center pb-3 border-b border-primary border-opacity-20">
        <div>
          <span className="text-[9px] uppercase font-extrabold text-accent tracking-widest flex items-center gap-1">
            <Award className="w-3.5 h-3.5" /> 20 Points WebRTC Bonus Activated
          </span>
          <h3 className="text-lg font-extrabold text-textDark mt-1">
            Live Call Pipeline
          </h3>
        </div>
        
        {/* Status Indicator */}
        <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase ${
          callState === "connected" ? "bg-green-100 text-green-700 animate-pulse" :
          callState === "connecting" || callState === "ringing" ? "bg-yellow-100 text-yellow-700 animate-bounce" :
          "bg-background text-textLight"
        }`}>
          {callState === "connected" ? "● Connected" : callState}
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-xl text-xs text-red-700 font-bold flex gap-2">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Video View Grids */}
      {callState === "connected" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-72">
          
          {/* Local Feed */}
          <div className="relative rounded-2xl overflow-hidden bg-textDark border border-primary border-opacity-25 shadow-inner">
            <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
            <span className="absolute bottom-3 left-3 bg-black bg-opacity-65 text-white font-bold text-[9px] px-2.5 py-1 rounded-md">
              You (Local)
            </span>
          </div>

          {/* Remote Feed */}
          <div className="relative rounded-2xl overflow-hidden bg-textDark border border-primary border-opacity-25 shadow-inner">
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <span className="absolute bottom-3 left-3 bg-black bg-opacity-65 text-white font-bold text-[9px] px-2.5 py-1 rounded-md">
              {partnerName}
            </span>
          </div>

        </div>
      ) : (
        /* Placeholder standby view */
        <div className="h-48 rounded-2xl bg-background bg-opacity-30 border border-primary border-opacity-20 flex flex-col items-center justify-center text-center p-6">
          <Phone className="w-12 h-12 text-secondary animate-bounce mb-2" />
          <h4 className="font-bold text-textDark text-sm">Standby Call Line</h4>
          <p className="text-xs text-textLight max-w-sm mt-1">
            Ensure both you and the {callerRole === "USER" ? "caterer" : "customer"} are viewing this specific order page to establish a direct P2P link!
          </p>
        </div>
      )}

      {/* Action Media Controls Footer */}
      <div className="flex justify-center items-center gap-4 pt-3 border-t border-dashed border-primary border-opacity-20">
        
        {callState === "connected" && (
          <>
            {/* Toggle Mic */}
            <button
              onClick={toggleMute}
              className={`p-3.5 rounded-full border transition duration-200 shadow-sm ${
                micMuted
                  ? "bg-red-100 text-red-600 border-red-200 hover:bg-red-200"
                  : "bg-background text-textDark border-primary border-opacity-30 hover:bg-primary hover:text-white"
              }`}
            >
              {micMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Toggle Cam */}
            <button
              onClick={toggleCam}
              className={`p-3.5 rounded-full border transition duration-200 shadow-sm ${
                camOff
                  ? "bg-red-100 text-red-600 border-red-200 hover:bg-red-200"
                  : "bg-background text-textDark border-primary border-opacity-30 hover:bg-primary hover:text-white"
              }`}
            >
              {camOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
          </>
        )}

        {/* Start / Stop Call Button */}
        {callState === "connected" || callState === "connecting" || callState === "ringing" ? (
          <button
            onClick={endCall}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-extrabold px-8 py-3.5 rounded-full transition shadow-md"
          >
            <PhoneOff className="w-5 h-5" /> End Call
          </button>
        ) : (
          <button
            onClick={startCall}
            disabled={!myPeerId}
            className="flex items-center gap-2 bg-secondary hover:bg-accent text-white font-extrabold px-8 py-3.5 rounded-full transition shadow-md disabled:opacity-50"
          >
            <Phone className="w-5 h-5" /> Start Live Call
          </button>
        )}

      </div>

    </div>
  );
}
