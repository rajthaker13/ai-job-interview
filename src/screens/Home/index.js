import { TextInput } from "@tremor/react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";

export default function Home(props) {
  const openai = new OpenAI({
    apiKey: "sk-proj-bDhKwBhyKB0Del1D2IiPT3BlbkFJCAoB10kc39MQMqI5pD2V",
    dangerouslyAllowBrowser: true,
  });
  const pinecone = new Pinecone({
    apiKey: process.env.REACT_APP_LINK_PINECONE_KEY,
  });
  const [jobDescription, setJobDescription] = useState("");
  const [leetcodeMatches, setLeetodeMatches] = useState([]);

  async function getLeetcodeProblems() {
    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: `${jobDescription}`,
    });
    const index = pinecone.index("leetcode-problems");

    const ns1 = index.namespace("version-1");

    const matchingProblems = await ns1.query({
      topK: 5,
      vector: embedding.data[0].embedding,
      includeMetadata: true,
      filter: {
        description: { $ne: "SQL Schema" },
      },
    });

    console.log("Matching problems", matchingProblems);
    setLeetodeMatches(matchingProblems.matches);
    setJobDescription("");
  }
  return (
    <div className="flex-col items-center justify-center mx-[10vw] h-[100vh]">
      <div className="text-center mt-[30vh] flex flex-col items-center">
        <p>Enter job description</p>
        <textarea
          value={jobDescription}
          onChange={(e) => {
            setJobDescription(e.target.value);
          }}
          className="border rounded-md p-2 h-[20vh] w-[30vw] mt-4"
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
      <div className="h-[50vh] overflow-scroll">
        {leetcodeMatches.map((question) => {
          return (
            <div>
              <br />
              <p>{`${question.metadata.title}: ${question.metadata.description}`}</p>
              <br />
            </div>
          );
        })}
      </div>
    </div>
  );
}
