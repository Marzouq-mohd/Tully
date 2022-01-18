import React, { useRef, useEffect, useState, Fragment } from "react";
import Head from "next/head";
import firebase from "firebase/app";
import "firebase/firestore";
import initFirebase from "../services/firebase";
import { useRouter } from "next/router";
import Script from "next/script";
import {
  useAuthUser,
  withAuthUser,
  withAuthUserTokenSSR,
} from "next-firebase-auth";
import FirebaseAuth from "../components/FirebaseAuth";
import { LockClosedIcon } from "@heroicons/react/solid";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import { BellIcon, MenuIcon, XIcon } from "@heroicons/react/outline";
import { Tab } from "@headlessui/react";

initFirebase();

const Dashboard = () => {
  const firestore = firebase.firestore();
  const router = useRouter();
  const AuthUser = useAuthUser();
  const createOffer = async (e) => {
    e.preventDefault();
    const data = {
      title: e.target.title.value,
      host: AuthUser.email,
    };

    const callDoc = firestore.collection("calls").doc();
    await callDoc.set({ data });
    router.push(`/call/${callDoc.id}?v1=1`);
  };

  function classNames(...classes) {
    return classes.filter(Boolean).join(" ");
  }

  let [categories] = useState({
    "Host a Call": [
      {
        id: 1,
        title: "Does drinking coffee make you smarter?",
        date: "5h ago",
        commentCount: 5,
        shareCount: 2,
      },
    ],
    "Join a Call": [
      {
        id: 1,
        title: "Is tech making coffee better or worse?",
        date: "Jan 7",
        commentCount: 29,
        shareCount: 16,
      },
    ],
  });

  const user = {
    name: "Tom Cook",
    email: "tom@example.com",
    imageUrl: "https://avatars.dicebear.com/api/big-smile/:tully.svg",
  };
  const userNavigation = [
    { name: "Your Profile", href: "#" },
    { name: "Settings", href: "#" },
    { name: "Sign out", href: "#" },
  ];

  return (
    <>
      <div className="min-h-full">
        <Disclosure as="nav" className="bg-gray-800">
          {({ open }) => (
            <>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <img
                        className="h-8 w-8"
                        src="https://tailwindui.com/img/logos/workflow-mark-indigo-500.svg"
                        alt="Workflow"
                      />
                    </div>
                  </div>
                  <div className="hidden md:block">
                    <div className="ml-4 flex items-center md:ml-6">
                      <button
                        type="button"
                        className="bg-gray-800 p-1 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                        <span className="sr-only">View notifications</span>
                        <BellIcon className="h-6 w-6" aria-hidden="true" />
                      </button>

                      {/* Profile dropdown */}
                      <Menu as="div" className="ml-3 relative">
                        <div>
                          <Menu.Button className="max-w-xs bg-gray-800 rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                            <span className="sr-only">Open user menu</span>
                            <img
                              className="h-8 w-8 rounded-full"
                              src={user.imageUrl}
                              alt=""
                            />
                          </Menu.Button>
                        </div>
                        <Transition
                          as={Fragment}
                          enter="transition ease-out duration-100"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95">
                          {/* <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                            {userNavigation.map((item) => (
                              <Menu.Item key={item.name}>
                                {({ active }) => (
                                  <a
                                    href={item.href}
                                    className={classNames(
                                      active ? "bg-gray-100" : "",
                                      "block px-4 py-2 text-sm text-gray-700"
                                    )}>
                                    {item.name}
                                  </a>
                                )}
                              </Menu.Item>
                            ))}
                          </Menu.Items> */}
                        </Transition>
                      </Menu>
                    </div>
                  </div>
                  <div className="-mr-2 flex md:hidden">
                    {/* Mobile menu button */}
                    <Disclosure.Button className="bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                      <span className="sr-only">Open main menu</span>
                      {open ? (
                        <XIcon className="block h-6 w-6" aria-hidden="true" />
                      ) : (
                        <MenuIcon
                          className="block h-6 w-6"
                          aria-hidden="true"
                        />
                      )}
                    </Disclosure.Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </Disclosure>

        <main>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <div className="border-4 border-dashed border-gray-200 rounded-lg  pt-24 pb-20 text-center flex justify-center flex-col items-center">
                <div className=" max-w-lg">
                  <h1 className="text-4xl leading-snug">
                    Start or Join a secure video and audio call with anyone.
                  </h1>
                  <p className="text-lg font-light leading-6 pb-6 text-gray-500 py-6">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  </p>
                </div>

                <div className="w-full max-w-md px-2 py-6 sm:px-0">
                  <Tab.Group>
                    <Tab.List className="flex p-1 space-x-1 bg-blue-900 bg-opacity-20 rounded-xl">
                      {Object.keys(categories).map((category) => (
                        <Tab
                          key={category}
                          className={({ selected }) =>
                            classNames(
                              "w-full py-2.5 text-sm leading-5 font-medium text-blue-700 rounded-lg",
                              "focus:outline-none focus:ring-2 ring-offset-2 ring-offset-blue-400 ring-white ring-opacity-60",
                              selected
                                ? "bg-white shadow"
                                : "text-blue-100 hover:bg-white/[0.12] hover:text-white"
                            )
                          }>
                          {category}
                        </Tab>
                      ))}
                    </Tab.List>
                    <Tab.Panels className="mt-2">
                      <Tab.Panel
                        className={classNames(
                          "bg-white rounded-xl p-3",
                          "focus:outline-none focus:ring-2 ring-offset-2 ring-offset-blue-400 ring-white ring-opacity-60"
                        )}>
                        <form onSubmit={createOffer}>
                          <div>
                            <div className="mt-1 relative rounded-md shadow-sm w-full flex">
                              <input
                                type="text"
                                name="title"
                                id="title"
                                className="focus:ring-indigo-500 focus:border-indigo-500 block pl-7 w-3/4 pr-12  border-gray-300 border rounded-md leading-10 mr-2"
                                placeholder="Input Title, E.g CSC 420 Lecture"
                                required
                              />
                              <button
                                type="submit"
                                className="h-auto bg-blue-600 rounded-md shadow w-1/4 text-white">
                                Start
                              </button>
                            </div>
                          </div>
                        </form>
                      </Tab.Panel>
                      <Tab.Panel
                        className={classNames(
                          "bg-white rounded-xl p-3",
                          "focus:outline-none focus:ring-2 ring-offset-2 ring-offset-blue-400 ring-white ring-opacity-60"
                        )}>
                        <form>
                          <div>
                            <div className="mt-1 relative rounded-md shadow-sm w-full flex">
                              <input
                                type="text"
                                name="title"
                                id="title"
                                className="focus:ring-indigo-500 focus:border-indigo-500 block pl-7 w-3/4 pr-12  border-gray-300 border rounded-md leading-10 mr-2"
                                placeholder="Input call code or link"
                                required
                              />
                              <button
                                type="submit"
                                className="h-auto bg-blue-600 rounded-md shadow w-1/4 text-white">
                                Join
                              </button>
                            </div>
                          </div>
                        </form>
                      </Tab.Panel>
                    </Tab.Panels>
                  </Tab.Group>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

// Note that this is a higher-order function.
export const getServerSideProps = withAuthUserTokenSSR()();

export default withAuthUser()(Dashboard);
