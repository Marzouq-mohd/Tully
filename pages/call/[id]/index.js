import React, { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import {
  ChevronLeft,
  MessageSquare,
  Plus,
  MicOff,
  Maximize2,
  Video,
  Settings,
  VolumeX,
} from "react-feather";
import firebase from "firebase/app";
import "firebase/firestore";
import initFirebase from "../../../services/firebase";

initFirebase();

export default function Call() {
  const firestore = firebase.firestore();
  const connection = useRef(null);
  // const remoteStream = useRef(null);
  const webcamVideo = useRef(null);
  const remoteVideo = useRef(null);
  // const callInput = useRef(null);
  const servers = {
    iceServers: [
      {
        urls: [
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
        ],
      },
    ],
    iceCandidatePoolSize: 10,
  };
  const router = useRouter();
  const { id } = router.query;
  // Global State
  useEffect(() => {
    connection.current = new RTCPeerConnection(servers);
    // console.log(id);
    webcamButton();
  });
  // HTML elements
  // const webcamButton = React.createRef();
  // const webcamButton = document.getElementById("webcamButton");
  // const webcamVideo = document.getElementById("webcamVideo");
  // const callButton = document.getElementById("callButton");
  // const callInput = document.getElementById("callInput");
  // const answerButton = document.getElementById("answerButton");
  // const remoteVideo = document.getElementById("remoteVideo");
  // const hangupButton = document.getElementById("hangupButton");
  // 1. Setup media sources

  const webcamButton = async () => {
    let localStream = null;
    let remoteStream = null;

    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    remoteStream = new MediaStream();

    // Push tracks from local stream to peer connection
    localStream.getTracks().forEach((track) => {
      connection.current.addTrack(track, localStream);
    });

    // Pull tracks from remote stream, add to video stream
    connection.current.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
    };

    webcamVideo.current.srcObject = localStream;
    // remoteVideo.current.srcObject = remoteStream;
    // webcamVideo.srcObject = localStream;
    // remoteVideo.srcObject = remoteStream;

    // callButton.disabled = false;
    // answerButton.disabled = false;
    // webcamButton.disabled = true;
    // callButton();
  };
  // const admitGuest = async () => {
  //   remoteStream.current = new MediaStream();
  //   // Pull tracks from remote stream, add to video stream
  //   connection.current.ontrack = (event) => {
  //     event.streams[0].getTracks().forEach((track) => {
  //       remoteStream.current.addTrack(track);
  //     });
  //   };
  //   remoteVideo.current.srcObject = remoteStream.current;

  //   callButton();
  // };
  // 2. Create an offer
  const callButton = async () => {
    // Reference Firestore collections for signaling
    const callDoc = firestore.collection("calls").doc("tdYzjohmYNzdnOjwt3YX");
    const offerCandidates = callDoc.collection("offerCandidates");
    const answerCandidates = callDoc.collection("answerCandidates");

    // callInput.current = callDoc.id;

    // Get candidates for caller, save to db
    connection.current.onicecandidate = (event) => {
      event.candidate && offerCandidates.add(event.candidate.toJSON());
    };

    // Create offer
    const offerDescription = await connection.current.createOffer();
    await connection.current.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };

    await callDoc.set({ offer });

    // Listen for remote answer
    callDoc.onSnapshot((snapshot) => {
      const data = snapshot.data();
      if (!connection.current.currentRemoteDescription && data?.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        connection.current.setRemoteDescription(answerDescription);
        console.log("execution stage");
      }
    });

    // When answered, add candidate to peer connection
    answerCandidates.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const candidate = new RTCIceCandidate(change.doc.data());
          // console.log(candidate);
          // connection.current.addIceCandidate(candidate);
        }
      });
    });

    // hangupButton.disabled = false;
    // answerButton();
  };

  // 3. Answer the call with the unique ID
  const answerButton = async () => {
    alert("trig");
    const callId = id;
    // const callDoc = firestore.collection("calls").doc(callId);
    const callDoc = firestore.collection("calls").doc("tdYzjohmYNzdnOjwt3YX");
    const answerCandidates = callDoc.collection("answerCandidates");
    const offerCandidates = callDoc.collection("offerCandidates");

    connection.current.onicecandidate = (event) => {
      event.candidate && answerCandidates.add(event.candidate.toJSON());
    };

    const callData = (await callDoc.get()).data();

    const offerDescription = callData.offer;
    await connection.current.setRemoteDescription(
      new RTCSessionDescription(offerDescription)
    );

    const answerDescription = await connection.current.createAnswer();
    await connection.current.setLocalDescription(answerDescription);

    const answer = {
      type: answerDescription.type,
      sdp: answerDescription.sdp,
    };

    await callDoc.update({ answer });

    offerCandidates.onSnapshot((snapshot) => {
      snapshot.docChanges().forEach((change) => {
        console.log(change);
        if (change.type === "added") {
          let data = change.doc.data();
          // console.log(data);
          connection.current.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });
  };
  return (
    <div className={"h-screen md:grid grid-cols-3 grid-flow-col gap-8 px-12"}>
      <section className={"col-span-2 my-4"}>
        <header className={""}>
          <div
            className={
              "flex justify-between py-5 w-full border-b border-solid border-gray-200"
            }
          >
            <div className={"flex"}>
              <div
                className={
                  "bg-gray-200 px-1 py-2 inline-block rounded-xl items-center"
                }
              >
                <ChevronLeft
                  onClick={answerButton}
                  className={"h-4 stroke-current text-gray-500"}
                />
              </div>
              <h1 className={"text-gray-900 font-semibold px-4 text-lg"}>
                Overview of new real estate proposals
              </h1>
            </div>
            <div className={""}>
              <MessageSquare
                onClick={callButton}
                className={" stroke-current text-gray-500"}
              />
            </div>
          </div>
          <div className={"py-5"}>
            <div className={"flex items-center justify-between"}>
              <div className={"flex items-center"}>
                <Image
                  src="/icons/users.svg"
                  alt="Picture of the author"
                  width={15}
                  height={15}
                />
                <h2 className={"text-sm font-medium text-gray-600 px-1"}>
                  Invited to call:
                </h2>
                <mark
                  className={
                    "bg-gray-200 px-3 py-1 rounded-lg font-medium text-sm font-sans text-gray-500 mx-1"
                  }
                >
                  6
                </mark>
              </div>
              <div className={"flex items-center"}>
                <div className={"bg-green-700 py-2 px-1 rounded-xl"}>
                  <Plus className={"h-4 stroke-current text-white"} />
                </div>
                <h2 className={"text-sm font-medium text-green-700 px-2"}>
                  Add user to call
                </h2>
              </div>
            </div>
          </div>
        </header>
        <main className={""}>
          <div
            className={"rounded-xl relative  flex flex-col justify-between"}
            style={{ height: "30rem" }}
          >
            <div
              className={
                // "w-full h-5/6 bg-gray-200 p-4 rounded-xl flex flex-wrap justify-evenly"
                "w-full h-5/6 bg-gray-200 p-4 rounded-xl grid grid-cols-2 gap-4"
              }
              // bg-hero-image bg-no-repeat bg-cover bg-center
            >
              <div className="flex items-center col-start-1 col-end-2">
                <video
                  className={"rounded-xl "}
                  style={{ transform: "rotateY(180deg)" }}
                  ref={webcamVideo}
                  autoPlay
                  playsInline
                ></video>
              </div>
              <div className="flex items-center">
                <video
                  className={"rounded-xl "}
                  style={{ transform: "rotateY(180deg)" }}
                  ref={remoteVideo}
                  autoPlay
                  playsInline
                ></video>
              </div>
            </div>

            <div className={"absolute z-50 hidden opacity-0 top-8 right-4"}>
              <div className={"flex flex-col items-center"}>
                <div
                  className={
                    "border-2 border-white border-solid rounded-2xl w-20 h-20 my-2 mt-0"
                  }
                >
                  <Image
                    src="https://picsum.photos/200"
                    alt="Picture of the author"
                    width={80}
                    height={80}
                    className={"rounded-2xl"}
                  />
                </div>
                <div
                  className={
                    "border-2 border-white border-solid rounded-2xl w-20 h-20 my-2"
                  }
                >
                  <Image
                    src="https://picsum.photos/200"
                    alt="Picture of the author"
                    width={80}
                    height={80}
                    className={"rounded-2xl"}
                  />
                </div>
                <div
                  className={
                    "border-2 border-white border-solid rounded-2xl w-20 h-20 my-2"
                  }
                >
                  <Image
                    src="https://picsum.photos/200"
                    alt="Picture of the author"
                    width={80}
                    height={80}
                    className={"rounded-2xl"}
                  />
                </div>
              </div>
            </div>
            <div className={"absolute z-50 hidden opacity-0 bottom-8 left-4"}>
              <div className={"flex flex-col items-center"}>
                <div
                  className={
                    "bg-gray-400 inline-block px-4 py-4 rounded-full mx-2"
                  }
                >
                  <VolumeX className={"fill-current text-white h-4 w-4"} />
                </div>
              </div>
            </div>
            <div className={""}>
              <div className={"flex items-center justify-center"}>
                <div
                  className={
                    "bg-gray-400 inline-block px-4 py-4 rounded-full mx-2"
                  }
                >
                  <Maximize2 className={"fill-current text-white h-4 w-4"} />
                </div>
                <div
                  className={
                    "bg-gray-400 inline-block px-4 py-4 rounded-full mx-2"
                  }
                >
                  <MicOff className={"fill-current text-white h-4 w-4"} />
                </div>
                <button
                  className={
                    "bg-red-400 inline-block px-4 py-3  rounded-xl mx-2 text-white font-medium"
                  }
                >
                  End Call
                  {/* <Image
                    src="/icons/phone.svg"
                    alt="Picture of the author"
                    width={25}
                    height={25}
                  /> */}
                </button>
                <div
                  className={
                    "bg-gray-400 inline-block px-4 py-4 rounded-full mx-2"
                  }
                >
                  <Video className={"fill-current text-white h-4 w-4"} />
                </div>
                <div
                  className={
                    "bg-gray-400 inline-block px-4 py-4 rounded-full mx-2"
                  }
                >
                  <Settings className={"stroke-current text-white h-4 w-4"} />
                </div>
              </div>
            </div>
          </div>
          <div className={" hidden opacity-0 flex-col items-center"}>
            <div
              className={
                "border-2 border-white border-solid rounded-2xl w-50 h-50 my-2 mt-0"
              }
            >
              <Image
                src="https://picsum.photos/200"
                alt="Picture of the author"
                width={400}
                height={400}
                className={"rounded-2xl"}
              />
            </div>
            <div
              className={
                "border-2 border-white border-solid rounded-2xl w-50 h-50 my-2 mt-0"
              }
            >
              <Image
                src="https://picsum.photos/200"
                alt="Picture of the author"
                width={400}
                height={400}
                className={"rounded-2xl"}
              />
            </div>
          </div>
        </main>
      </section>
      <section
        className={"col-span-1 rounded-xl bg-gray-200 my-4 md:block hidden"}
      >
        <header
          className={
            "py-5 px-4 border-b border-solid border-gray-300 flex justify-between"
          }
        >
          <h1 className={"text-gray-900 font-semibold text-lg "}>Group Chat</h1>
          <div>
            <button
              className={
                "text-sm font-medium text-green-700 px-5 py-2 rounded-xl bg-gray-300 hover:bg-gray-300 hover:text-green-700 active:bg-gray-300 active:text-green-700"
              }
            >
              Messages
            </button>
            <button
              className={
                "text-sm font-medium text-gray-600 px-5 py-2 rounded-xl hover:bg-gray-300 hover:text-green-700 active:bg-gray-300 active:text-green-700"
              }
            >
              Participants
            </button>
          </div>
        </header>
      </section>
    </div>
  );
}
