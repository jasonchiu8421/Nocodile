"use client";

import React from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const style = { backgroundColor: "white", borderTop: "1px solid #eaeaea" };
const Home = () => {
  const router = useRouter();
  let [username, setUsername] = useState("");
  let [password, setPassword] = useState("");

  const handleLogin = async () => {
    console.warn("submit POST req", { username, password });
    const userId = 98989898; //get from server
    cookieStore.set("userId", userId);
    router.push(`/dashboard?userId=${userId}`);
    /*await fetch("localhost:5000/login/", {
                    method: "POST",
                    body: JSON.stringify({ username, password }),
                  })
                    .then((res) => res.json())
                    .then(({ success, userId }) => {
                      cookieStore.set("userId", userId);
                      router.push(`/dashboard?userId=${userId}`);
                    })
                    .catch((err) => alert("Login failed: " + err.message));*/
  };

  return (
    <div className="items-center flex flex-col min-w-screen">
      <div className="items-center flex flex-col min-w-screen">
        <div className="flex flex-col items-center py-2 w-fit bg-white p-16 m-12 border-t-4 border-blue-600 shadow-lg">
          <h1>Nocodile AI</h1>
          <small>Train your AI model in minutes!</small>
          <form className="flex flex-col items-cente justify-center py-2 gap-2">
            <div>
              <label>Username:</label>
              <br />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label>Password:</label>
              <br />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Link href="dashboard">
              <button
                className="bg-blue-500 text-white rounded-lg px-4 py-2 hover:bg-blue-600"
                onClick={handleLogin}
              >
                Login
              </button>
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Home;
