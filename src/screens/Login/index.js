import { TextInput } from "@tremor/react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import automock from "../../assets/logo.png";
import coderoyale from "../../assets/coderoyale.png";

export default function Login(props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isNewAccount, setIsNewAccount] = useState(props.isNewAccount);

  const navigation = useNavigate();

  async function signIn() {
    const { data, error } = await props.db.auth.signInWithPassword({
      email: email,
      password: password,
    });
    if (!error) {
      localStorage.setItem("email", data.user.email);
      localStorage.setItem("uid", data.user.id);
      navigation("/home");
    }
  }

  async function signUp() {
    if (password == confirmPassword) {
      localStorage.clear();
      const { data } = await props.db.auth.signUp({
        email: email,
        password: password,
      });
      localStorage.setItem("email", data.user.email);
      localStorage.setItem("uid", data.user.id);
      navigation("/home");
    }
  }

  return (
    <div className="flex justify-center align-middle text-center h-[100vh] bg-[#05050D]">
      <div className=" h-[auto] py-80 rounded-lg w-[20vw]">
        <div className="">
          <img
            src={coderoyale}
            className="object-contain w-[100%] h-[5vh] justify-center content-center mb-5"
          />
          <span className="text-center text-tremor-title text-white font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong leading-[1px]">
            Log in or create account
          </span>
          <div className="mt-6 text-left">
            <label
              htmlFor="email"
              className="text-tremor-default font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong text-left text-white"
            >
              Email
            </label>
            <TextInput
              type="email"
              id="email"
              name="email"
              autoComplete="email"
              placeholder="john@company.com"
              className="mt-4 mb-4"
              value={email}
              onValueChange={setEmail}
            />
            <label
              htmlFor="email"
              className="text-tremor-default font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong text-left text-white"
            >
              Password
            </label>
            <TextInput
              type="password"
              id="password"
              name="password"
              autoComplete="password"
              placeholder="Password"
              className="mt-4 mb-4"
              value={password}
              onValueChange={setPassword}
            />
            {isNewAccount && (
              <>
                <label
                  htmlFor="email"
                  className="text-tremor-default font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong text-left text-white"
                >
                  Confirm password
                </label>
                <TextInput
                  type="password"
                  id="password"
                  name="password"
                  autoComplete="password"
                  placeholder="Password"
                  className="mt-4 mb-4"
                  value={confirmPassword}
                  onValueChange={setConfirmPassword}
                />
              </>
            )}

            <button
              onClick={async () => {
                if (!isNewAccount) {
                  await signIn();
                } else {
                  await signUp();
                }
              }}
              className="mt-4 w-full whitespace-nowrap rounded-tremor-default bg-tremor-brand py-2 text-center text-tremor-default font-medium text-tremor-brand-inverted shadow-tremor-input hover:bg-tremor-brand-emphasis dark:bg-dark-tremor-brand dark:text-dark-tremor-brand-inverted dark:shadow-dark-tremor-input dark:hover:bg-dark-tremor-brand-emphasis"
            >
              {isNewAccount ? "Create account" : "Sign in"}
            </button>
          </div>
          {isNewAccount && (
            <p className="mt-4 text-tremor-subtitle text-tremor-content dark:text-dark-tremor-content">
              Already have an account?{" "}
              <a href="/login" className="underline underline-offset-4">
                Sign In here
              </a>
            </p>
          )}
          {!isNewAccount && (
            <p className="mt-4 text-tremor-subtitle text-tremor-content dark:text-dark-tremor-content">
              Don't have an account?{" "}
              <a href="/" className="underline underline-offset-4">
                Sign up here
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
