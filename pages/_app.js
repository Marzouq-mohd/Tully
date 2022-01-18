// import "../styles/globals.css";
import "tailwindcss/tailwind.css";
import initAuth from "../services/initAuth";
import Script from "next/script";

initAuth();

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Script src="/scripts/face-api.js" strategy="beforeInteractive" />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
