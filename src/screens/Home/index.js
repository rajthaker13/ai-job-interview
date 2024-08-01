import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";
import automock from "../../assets/logo.png";
import favicon from "../../assets/favicon.png";
import coderoyale from "../../assets/coderoyale.png";
import { Button, Navbar } from "flowbite-react";

export default function Home(props) {
  const openai = new OpenAI({
    apiKey: "sk-proj-bDhKwBhyKB0Del1D2IiPT3BlbkFJCAoB10kc39MQMqI5pD2V",
    dangerouslyAllowBrowser: true,
  });
  const pinecone = new Pinecone({
    apiKey: process.env.REACT_APP_LINK_PINECONE_KEY,
  });

  const navigate = useNavigate();

  const [jobDescription, setJobDescription] = useState("");

  async function getLeetcodeProblems() {
    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: `${jobDescription}`,
    });
    const index = pinecone.index("leetcode-problems");

    const ns1 = index.namespace("version-1");

    const matchingProblems = await ns1.query({
      topK: 1,
      vector: embedding.data[0].embedding,
      includeMetadata: true,
      filter: {
        description: { $ne: "SQL Schema" },
      },
    });

    setJobDescription("");
    navigate("/interview", { state: matchingProblems.matches });
  }

  return (
    <div className="flex justify-center align-middle text-center h-[100vh] bg-[#05050D]">
      <div className="text-center text-white flex flex-col items-center">
        <p>Enter job description</p>
        <textarea
          value={jobDescription}
          onChange={(e) => {
            setJobDescription(e.target.value);
          }}
          className="border rounded-md p-2 h-[20vh] w-[30vw] mt-4 text-black"
        ></textarea>
        <button
          onClick={async () => {
            await getLeetcodeProblems();
          }}
          className="mt-4 w-[20vh] whitespace-nowrap rounded-tremor-default bg-tremor-brand py-2 text-center text-tremor-default font-medium text-tremor-brand-inverted shadow-tremor-input hover:bg-tremor-brand-emphasis dark:bg-dark-tremor-brand dark:text-dark-tremor-brand-inverted dark:shadow-dark-tremor-input dark:hover:bg-dark-tremor-brand-emphasis"
        >
          Submit
        </button>
      </div>
    </div>
  );
}
