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
  Monitor,
} from "react-feather";
import firebase from "firebase/app";
import "firebase/firestore";
import initFirebase from "../../../services/firebase";
import Script from "next/script";
import {
  useAuthUser,
  withAuthUser,
  withAuthUserTokenSSR,
  AuthAction,
} from "next-firebase-auth";
import swal from "sweetalert";
// import { withAuthUser, AuthAction } from "next-firebase-auth";
import FirebaseAuth from "../../../components/FirebaseAuth";
// import SocketIOClient from "socket.io-client";

initFirebase();

const Call = () => {
  // export default function Call() {
  const AuthUser = useAuthUser();
  const firestore = firebase.firestore();
  const connection = useRef(null);
  const localStream = useRef(null);
  const remoteStream = useRef(null);
  const webcamVideo = useRef(null);
  const remoteVideo = useRef(null);
  const callDataResponse = useRef(null);
  const [video, setVideo] = useState(true);
  const [audio, setAudio] = useState(true);
  const videoW = useRef(true);
  const toggleVideoState = () => setVideo(!video);
  const incrementCounter = () => setCounterState(counterState + 1);
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
  useEffect(async () => {
    await faceapi.nets.ssdMobilenetv1.load("/weights");
    await faceapi.loadFaceExpressionModel("/weights");
    connection.current = new RTCPeerConnection(servers);
    startMedia();
    const callDoc = await firestore.collection("calls").doc(id).get();
    callDataResponse = callDoc.data();
    console.log(callDataResponse);
    if (AuthUser.email == callDataResponse.data.host && router.query.v1 == 1) {
      console.log("host");
      callButton();
      router.push(
        {
          pathname: `/call/[id]`,
          query: {
            id,
          },
        },
        `/call/${id}`,
        { shallow: true }
      );
    }
  });

  const startMedia = async (options) => {
    options = options || null;
    localStream.current = await navigator.mediaDevices.getUserMedia(
      options
        ? options
        : {
            video: true,
            audio: true,
          }
    );
    remoteStream.current = new MediaStream();

    // Push tracks from local stream to peer connection
    localStream.current.getTracks().forEach((track) => {
      connection.current.addTrack(track, localStream.current);
    });

    // Pull tracks from remote stream, add to video stream
    connection.current.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.current.addTrack(track);
      });
    };

    webcamVideo.current.srcObject = localStream.current;
    remoteVideo.current.srcObject = remoteStream.current;
    webcamVideo.current.muted = true;
  };
  const toggleVideo = () => {
    if (video) {
      localStream.current.getVideoTracks()[0].stop();
      webcamVideo.current.pause();
      webcamVideo.current.srcObject = null;
      // console.log(localStream.current.getVideoTracks());
      // videoW.current = false;
    } else if (!video) {
      // startMedia();
      // videoW.current = true;
    }
    toggleVideoState();
    console.log(videoW, video);
  };
  const toggleAudio = () => {
    audio ? localStream.current.getAudioTracks()[0].stop() : console.log(media);
    // setMedia((prevState) => {
    //   return { ...prevState, audio: !prevState.audio };
    // });
  };
  const callButton = async () => {
    // Reference Firestore collections for signaling
    const callDoc = firestore.collection("calls").doc(id);
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
    await callDoc.update({ offer });

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
          console.log(candidate);
          connection.current.addIceCandidate(candidate);
        }
      });
    });
  };
  const answerButton = async () => {
    const callId = id;
    const callDoc = firestore.collection("calls").doc(callId);
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
        console.log(change.type);
        if (change.type === "added") {
          let data = change.doc.data();
          console.log(data);
          connection.current.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });
  };

  const onPlay = async () => {
    const videoEl = webcamVideo.current;

    if (videoEl.paused || videoEl.ended || !isFaceDetectionModelLoaded())
      return setTimeout(() => onPlay());

    const minConfidence = 0.5;
    const options = new faceapi.SsdMobilenetv1Options({ minConfidence });

    const result = await faceapi
      .detectSingleFace(videoEl, options)
      .withFaceExpressions();

    if (result) {
      const canvas = document.getElementById("overlay");
      const dims = faceapi.matchDimensions(canvas, videoEl, true);
      const resizedResult = faceapi.resizeResults(result, dims);
      faceapi.draw.drawDetections(canvas, resizedResult);
      faceapi.draw.drawFaceExpressions(canvas, resizedResult, minConfidence);
    }

    setTimeout(() => onPlay());
  };

  const getCurrentFaceDetectionNet = () => {
    return faceapi.nets.ssdMobilenetv1;
  };

  const isFaceDetectionModelLoaded = () => {
    return !!getCurrentFaceDetectionNet().params;
  };

  return (
    <>
      <div className={"h-screen md:grid grid-cols-3 grid-flow-col gap-8 px-12"}>
        <section className={"col-span-3 my-4"}>
          <header className={""}>
            <div
              className={
                "flex justify-between py-5 w-full border-b border-solid border-gray-200"
              }>
              <div className={"flex"}>
                <div
                  className={
                    "bg-gray-200 px-1 py-2 inline-block rounded-xl items-center"
                  }>
                  <ChevronLeft
                    onClick={answerButton}
                    className={"h-4 stroke-current text-gray-500"}
                  />
                </div>
                <h1 className={"text-gray-900 font-semibold px-4 text-lg"}>
                  {callDataResponse.data?.title
                    ? callDataResponse.data?.title
                    : "Test call"}
                </h1>
              </div>
              <div className={""}>
                {/* <MessageSquare
                  onClick={callButton}
                  className={" stroke-current text-gray-500"}
                /> */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            {/* <div className={"py-5"}>
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
                    }>
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
            </div> */}
          </header>
          <main className={""}>
            <div
              className={"rounded-xl relative  flex flex-col justify-between"}>
              <div
                className={
                  "w-full h-5/6 bg-gray-200 p-4 rounded-xl grid grid-cols-2 gap-4"
                }
                style={{ minHeight: "calc( 100vh - 11rem)" }}>
                <div className="flex items-center col-start-1 col-end-2 relative">
                  <video
                    className={"rounded-xl object-cover w-full h-full"}
                    style={{ transform: "rotateY(180deg)" }}
                    onLoadedMetadata={onPlay}
                    ref={webcamVideo}
                    autoPlay
                    playsInline></video>
                  <p className="absolute bottom-3 left-3 text-sm text-white">
                    {AuthUser.email ? AuthUser.email.split("@")[0] : ""}
                    &nbsp;| &nbsp;
                    {new Intl.DateTimeFormat("en-GB", {
                      year: "numeric",
                      month: "long",
                      day: "2-digit",
                    }).format(Date.now())}
                  </p>

                  <canvas className="absolute h-full w-full" id="overlay" />
                </div>
                <div className="flex items-center">
                  <video
                    className={"rounded-xl object-cover w-full h-full"}
                    style={{ transform: "rotateY(180deg)" }}
                    ref={remoteVideo}
                    autoPlay
                    playsInline></video>
                  {/* <canvas id="overlay" /> */}
                </div>
              </div>

              <div className={"absolute z-50 hidden opacity-0 top-8 right-4"}>
                <div className={"flex flex-col items-center"}>
                  <div
                    className={
                      "border-2 border-white border-solid rounded-2xl w-20 h-20 my-2 mt-0"
                    }>
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
                    }>
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
                    }>
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
              <div
                className={"absolute z-50 hidden opacity-0 bottom-8 left-4 "}>
                <div className={"flex flex-col items-center "}>
                  <div
                    className={
                      "bg-gray-400 inline-block px-4 py-4 rounded-full mx-2"
                    }>
                    <VolumeX className={"fill-current text-white h-4 w-4"} />
                  </div>
                </div>
              </div>
              <div className={""}>
                <div className={"flex items-center justify-center mt-5"}>
                  <div
                    className={
                      "bg-gray-400 inline-block px-4 py-4 rounded-full mx-2"
                    }>
                    <Maximize2 className={"fill-current text-white h-4 w-4"} />
                  </div>
                  <div
                    className={
                      "bg-gray-400 inline-block px-4 py-4 rounded-full mx-2"
                    }>
                    <MicOff
                      className={"fill-current text-white h-4 w-4"}
                      onClick={toggleAudio}
                    />
                  </div>
                  <button
                    className={
                      "bg-red-400 inline-block px-4 py-3  rounded-xl mx-2 text-white font-medium"
                    }>
                    End Call
                    {/* <Image
                    src="/icons/phone.svg"
                    alt="Picture of the author"
                    width={25}
                    height={25}
                  /> */}
                  </button>
                  <div
                    onClick={toggleVideo}
                    className={
                      "bg-gray-400 inline-block px-4 py-4 rounded-full mx-2 cursor-pointer"
                    }>
                    <Video className={"fill-current text-white h-4 w-4"} />
                  </div>
                  <div
                    className={
                      "bg-gray-400 inline-block px-4 py-4 rounded-full mx-2"
                    }>
                    <Monitor className={"stroke-current text-white h-4 w-4"} />
                  </div>
                </div>
              </div>
            </div>
            <div className={" hidden opacity-0 flex-col items-center"}>
              <div
                className={
                  "border-2 border-white border-solid rounded-2xl w-50 h-50 my-2 mt-0"
                }>
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
                }>
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
        {/* <section
          className={"col-span-1 rounded-xl bg-gray-200 my-4 md:block hidden"}>
          <header
            className={
              "py-5 px-4 border-b border-solid border-gray-300 flex justify-between"
            }>
            <h1 className={"text-gray-900 font-semibold text-lg "}>
              Group Chat
            </h1>
            <div>
              <button
                className={
                  "text-sm font-medium text-green-700 px-5 py-2 rounded-xl bg-gray-300 hover:bg-gray-300 hover:text-green-700 active:bg-gray-300 active:text-green-700"
                }>
                Messages
              </button>
              <button
                className={
                  "text-sm font-medium text-gray-600 px-5 py-2 rounded-xl hover:bg-gray-300 hover:text-green-700 active:bg-gray-300 active:text-green-700"
                }>
                Participants
              </button>
            </div>
          </header>
        </section> */}
      </div>
    </>
  );
};
export const getServerSideProps = withAuthUserTokenSSR({
  whenUnauthedAfterInit: AuthAction.REDIRECT_TO_APP,
})();

export default withAuthUser({
  whenUnauthedAfterInit: AuthAction.REDIRECT_TO_APP,
})(Call);
