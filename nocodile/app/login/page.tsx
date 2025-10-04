"use client";

import React, { useEffect } from "react";
import { useState } from "react";
import { redirect } from "next/navigation";

const style = { backgroundColor: "white", borderTop: "1px solid #eaeaea" };
const Home = () => {
  let [username, setUsername] = useState("");
  let [password, setPassword] = useState("");
  let [errorMsg, setErrorMsg] = useState("");

  //COOKIES ARE ASYNC
  useEffect(() => {
    cookieStore.get("userId").then((val) => {
      if (val !== undefined && val !== null) {
        redirect("/dashboard");
      }
    });
  }, []);

  const handleLogin = async () => {
    console.warn("submit POST req", { username, password });
    const userId = 98989898; //get from server
    cookieStore.set("userId", String(userId));
    redirect(`/dashboard`);
    /*await fetch("localhost:5000/login/", {
                    method: "POST",
                    body: JSON.stringify({ username, password }),
                  })
                    .then((res) => res.json())
                    .then(({ success, userId, message }) => {
                      if (!success) {
                        setErrorMsg("Login failed: " + message);
                      } else {
                        cookieStore.set("userId", String(userId));
                        redirect(`/dashboard`);
                      }
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
            <div className="text-red-500">{errorMsg}</div>

            <button
              className="bg-blue-500 text-white rounded-lg px-4 py-2 hover:bg-blue-600"
              onClick={handleLogin}
            >
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Home;
