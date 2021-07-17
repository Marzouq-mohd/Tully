import React, { useRef, useEffect, useState } from "react";
import Head from "next/head";
import firebase from "firebase/app";
import "firebase/firestore";
import initFirebase from "../services/firebase";
import { useRouter } from "next/router";

initFirebase();

export default function Home() {
  const firestore = firebase.firestore();
  const router = useRouter();
  useEffect(() => {
    // conection.current = new RTCPeerConnection(servers);
  });
  const createOffer = async (e) => {
    const callDoc = firestore.collection("calls").doc();
    e.preventDefault();
    router.push(`/call/${callDoc.id}`);
  };
  return (
    <div>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={"h-screen w-full flex justify-center"}>
        <section className={"m-28"}>
          <button
            className="px-4 py-2 text-base text-white bg-black rounded-lg"
            onClick={createOffer}
          >
            Test Call
          </button>
        </section>
      </main>
    </div>
  );
}
