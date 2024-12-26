import { TextInput } from "@tremor/react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import automock from "../../assets/logo.png";
import coderoyale from "../../assets/coderoyale.png";
import googleLogo from "../../assets/google-logo.png";

export default function Login(props) {
  const [isNewAccount, setIsNewAccount] = useState(props.isNewAccount);
  const navigation = useNavigate();

  async function signInWithOAuth() {
    localStorage.clear();
    await props.db.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: "http://localhost:3000/home",
      },
    });
  }

  return (
    <div className="flex justify-center items-center text-center h-[100vh] bg-[#05050D]">
      <div className="p-8 h-[auto] rounded-lg w-[400px] bg-[#0D0D1A] shadow-xl">
        <div className="space-y-6">
          <img
            src={coderoyale}
            className="object-contain w-[200px] h-[40px] mx-auto"
            alt="CodeRoyale Logo"
          />

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white">
              {isNewAccount ? "Create your account" : "Welcome back"}
            </h1>
            <p className="text-gray-400 text-sm">
              {isNewAccount
                ? "Get started with CodeRoyale"
                : "Sign in to continue to CodeRoyale"}
            </p>
          </div>

          <button
            onClick={async () => {
              await signInWithOAuth();
            }}
            className="flex items-center justify-center w-full gap-3 px-4 py-2.5 border border-gray-600 rounded-lg bg-[#1A1A2E] hover:bg-[#252538] transition-colors duration-200 text-white"
          >
            <img
              src={googleLogo}
              alt="Google Logo"
              className="w-5 h-5"
            />
            <span className="text-sm font-medium">
              {isNewAccount ? "Continue with Google" : "Sign in with Google"}
            </span>
          </button>

          <div className="text-sm text-gray-400">
            {isNewAccount ? (
              <p>
                Already have an account?{" "}
                <a href="/login" className="text-blue-500 hover:text-blue-400 font-medium">
                  Sign in
                </a>
              </p>
            ) : (
              <p>
                Don't have an account?{" "}
                <a href="/" className="text-blue-500 hover:text-blue-400 font-medium">
                  Sign up
                </a>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
