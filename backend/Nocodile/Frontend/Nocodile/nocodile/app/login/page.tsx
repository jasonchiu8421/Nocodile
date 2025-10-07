"use client";

import React, { useEffect } from "react";
import { useState } from "react";
import { redirect } from "next/navigation";
import ApiConnectionValidator from "@/components/ApiConnectionValidator";
import { log } from "@/lib/logger";

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
    log.info('LOGIN', 'Login attempt started', { username });
    
    try {
      // Test backend connection first
      const healthResponse = await fetch('http://host.docker.internal:8888/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!healthResponse.ok) {
        throw new Error(`Backend not available: HTTP ${healthResponse.status}`);
      }
      
      // Attempt actual login
      const loginResponse = await fetch('http://host.docker.internal:8888/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      
      if (!loginResponse.ok) {
        const errorData = await loginResponse.json();
        throw new Error(errorData.message || `Login failed: HTTP ${loginResponse.status}`);
      }
      
      const loginData = await loginResponse.json();
      
      if (loginData.success) {
        log.info('LOGIN', 'Login successful', { userId: loginData.userID });
        cookieStore.set("userId", String(loginData.userID));
        redirect(`/dashboard`);
      } else {
        setErrorMsg("Login failed: " + loginData.message);
        log.warn('LOGIN', 'Login failed', { message: loginData.message });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setErrorMsg("Login failed: " + errorMessage);
      log.error('LOGIN', 'Login error', { error: errorMessage });
    }
  };

  return (
    <div className="items-center flex flex-col min-w-screen">
      <div className="items-center flex flex-col min-w-screen">
        {/* API Connection Status */}
        <div className="w-full max-w-2xl mb-4">
          <ApiConnectionValidator 
            showDetails={true}
            autoValidate={true}
          />
        </div>
        
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
                className="border border-gray-300 rounded px-3 py-1"
              />
            </div>
            <div>
              <label>Password:</label>
              <br />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1"
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
