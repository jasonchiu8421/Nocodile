"use client";

import React from "react";
import Link from "next/link";

const style = {
  backgroundColor: "white",
  borderTop: "1px solid #eaeaea",
};
const Home = () => {
  let [isLoggedIn, setIsLoggedIn] = React.useState(false);
  let [email, setEmail] = React.useState("");
  let [password, setPassword] = React.useState("");

  return (
    <main className="items-center flex flex-col min-w-screen">
      <div className="flex flex-col items-center py-2 w-fit bg-white p-16 m-12 border-t-4 border-blue-600 shadow-lg">
        <h1>Nocodile AI</h1>
        <small>Train your AI model in minutes!</small>
        <form className="flex flex-col items-cente justify-center py-2 gap-2">
          <div>
            <label>Email address:</label>
            <br />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
          <button
            className="bg-blue-500 text-white rounded-lg px-4 py-2 hover:bg-blue-600"
            onClick={() => {
              console.warn("submit POST req");
            }}
          >
            <Link href="blocks">Login</Link>
          </button>
        </form>
      </div>
    </main>
  );
};

export default Home;
