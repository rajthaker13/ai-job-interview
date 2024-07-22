import { TextInput, Button } from "@tremor/react";
import { RiSearch2Line } from "@remixicon/react";
import React, { useEffect, useState, useRef } from "react";
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
  const [width, setWidth] = useState(60); // Initial width in vh

  const isResizing = useRef(false);
  const startX = useRef(0);

  const startResizing = (e) => {
    isResizing.current = true;
    startX.current = e.clientX;
    document.body.classList.add("no-select");
  };

  const stopResizing = () => {
    document.body.classList.remove("no-select");
    isResizing.current = false;
  };

  const resize = (e) => {
    if (isResizing.current) {
      const deltaX = e.clientX - startX.current;
      const newWidth = Math.max(
        20,
        Math.min(80, width + (deltaX / window.innerWidth) * 100)
      );
      setWidth(newWidth);
      startX.current = e.clientX;
    }
  };

  // Determine difficulty color
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "Easy":
        return "text-green-500";
      case "Medium":
        return "text-yellow-500";
      case "Hard":
        return "text-red-500";
      default:
        return "";
    }
  };

  // Function to format the topics
  const formatTopics = (topics) => {
    return topics.split(",").map((topic, index, array) => (
      <li
        key={index}
        className={`py-1 px-2 ${
          index < array.length - 1 ? "border-b border-gray-300" : ""
        }`}
      >
        {topic.trim()}
      </li>
    ));
  };

  // Component for the Topic Dropdown
  const TopicDropdown = ({ topics }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="relative inline-block text-left">
        <Button
          className="ml-2 px-1.5 py-1"
          color="slate"
          size="xs"
          icon={RiSearch2Line}
          onClick={() => setIsOpen(!isOpen)}
        >
          Topics
        </Button>
        {isOpen && (
          <div className="absolute z-10 mt-2 w-48 bg-white border border-gray-300 rounded-md shadow-lg">
            <ul className="text-sm">{formatTopics(topics)}</ul>
          </div>
        )}
      </div>
    );
  };

  // Function to convert Markdown-like text to HTML
  const formatDescription = (text) => {
    // Convert newline characters to <br>
    let formattedText = text.replace(/\n/g, "<br>");
    // Convert bold text **text** to <b>text</b>
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
    // Convert italic text *text* to <i>text</i>
    formattedText = formattedText.replace(/\*(.*?)\*/g, "<i>$1</i>");
    // Make special phrases bold
    formattedText = formattedText.replace(
      /Example (\d+):/g,
      "<b>Example $1:</b>"
    );
    formattedText = formattedText.replace(/Example:/g, "<b>Example:</b>");
    formattedText = formattedText.replace(/Note:/g, "<b>Note:</b>");
    formattedText = formattedText.replace(
      /Constraints:/g,
      "<b>Constraints:</b>"
    );
    // Convert `code` text to styled code
    formattedText = formattedText.replace(/`(.*?)`/g, "<code>$1</code>");
    return formattedText;
  };

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
      <div className="relative" onMouseMove={resize} onMouseUp={stopResizing}>
        <div
          className="overflow-scroll h-[50vh] border p-4"
          style={{ width: `${width}vh` }}
        >
          {leetcodeMatches.map((question) => {
            const { title, difficulty, description, url, related_topics } =
              question.metadata;
            console.log(question);

            return (
              <div key={title} className="mb-4">
                <h2 className="text-xl font-bold pb-1">{title}</h2>
                <div className="flex pb-3">
                  <p
                    className={`${getDifficultyColor(
                      difficulty
                    )} font-bold pr-2 text-base mt-0.5`}
                  >
                    {difficulty}
                  </p>
                  <TopicDropdown topics={related_topics} />
                </div>
                <p
                  dangerouslySetInnerHTML={{
                    __html: formatDescription(description),
                  }}
                ></p>
                <br></br>
                <a
                  href={url}
                  className="text-blue-500 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on Leetcode
                </a>
                <br></br>
              </div>
            );
          })}
        </div>
        <div
          className="absolute top-0 h-full w-1 bg-gray-400 cursor-col-resize"
          style={{ left: `${width}vh` }}
          onMouseDown={startResizing}
        ></div>
      </div>
      <style jsx>{`
        code {
          background-color: #f5f5f5;
          border-radius: 5px;
          padding: 2px 5px;
          font-family: "Courier New", Courier, monospace;
          color: #3f3b3a;
        }
        .no-select {
          user-select: none;
        }
      `}</style>
    </div>
  );
}
