import OpenAI from "openai";
import { TextInput, Button } from "@tremor/react";
import { RiSearch2Line } from "@remixicon/react";
import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { languageOptions } from "../../components/Editor/constants/languageOptions";
import Compiler from "../../components/Editor/Compiler";
import gptPic from "../../assets/favicon.png";
import userPic from "../../assets/user.png";

export default function Interview(props) {
  const openai = new OpenAI({
    apiKey: "sk-proj-bDhKwBhyKB0Del1D2IiPT3BlbkFJCAoB10kc39MQMqI5pD2V",
    dangerouslyAllowBrowser: true,
  });

  const navigate = useNavigate();

  const [problemWidth, setProblemWidth] = useState(40);
  const [editorWidth, setEditorWidth] = useState(60);
  const [ideHeight, setIdeHeight] = useState(50);
  const [selectedDiv, setSelectedDiv] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([
    {
      type: "gpt",
      content:
        "Hi, I'm Katie, and I'll be conducting your technical interview today. Let's get started! Please read over the problem and let me know if you have any clarifying questions. Remember to clearly explain your thought process throughout the interview. I'm here to help! Can you start by introducing yourself?",
    },
  ]);
  const [code, setCode] = useState("");
  const [outputDetails, setOutputDetails] = useState(null);
  const [language, setLanguage] = useState(languageOptions[0]);

  const isXResizing = useRef(false);
  const startX = useRef(0);

  const isYResizing = useRef(false);
  const startY = useRef(0);

  const location = useLocation();
  const leetcodeMatches = location.state || {};

  const startXResizing = (e) => {
    isXResizing.current = true;
    startX.current = e.clientX;
    document.body.classList.add("no-select");
  };

  const stopXResizing = () => {
    document.body.classList.remove("no-select");
    isXResizing.current = false;
  };

  const startYResizing = (e) => {
    isYResizing.current = true;
    startY.current = e.clientY;
    document.body.classList.add("no-select");
  };

  const stopYResizing = () => {
    document.body.classList.remove("no-select");
    isYResizing.current = false;
  };

  const resize = (e) => {
    if (isXResizing.current) {
      const deltaX = e.clientX - startX.current;
      const newProblemWidth = Math.max(
        20,
        Math.min(70, problemWidth + (deltaX / window.innerWidth) * 100)
      );
      const newEditorWidth = 100 - newProblemWidth;
      setProblemWidth(newProblemWidth);
      setEditorWidth(newEditorWidth);
      startX.current = e.clientX;
    }
    if (isYResizing.current) {
      const deltaY = e.clientY - startY.current;
      const newHeight = Math.max(
        25,
        Math.min(75, ideHeight + (deltaY / window.innerHeight) * 80)
      );
      setIdeHeight(newHeight);
      startY.current = e.clientY;
    }
  };

  function generateUniqueId() {
    const timestamp = Date.now().toString(); // Get current timestamp as string
    const randomString = Math.random().toString(36).substr(2, 5); // Generate random string
    const uniqueId = timestamp + randomString; // Concatenate timestamp and random string
    return uniqueId; // Extract first 10 characters to ensure 10-digit length
  }

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

  // Function to convert Markdown-like text to HTML
  const markdownToHTML = (text) => {
    // Convert newline characters to <br>
    let formattedText = text.replace(/\n/g, "<br>");

    // Convert LaTeX delimiters for inline math
    formattedText = formattedText.replace(/\\\((.*?)\\\)/g, "$1");
    formattedText = formattedText.replace(/\\\[(.*?)\\\]/g, "$1");

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

  // Funct

  // Function to format the topics
  const formatTopics = (topics) => {
    if (topics == "NaN") {
      return (
        <li className={"py-1 px-2 border-b border-gray-300"}>
          No topics available
        </li>
      );
    }

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

  function endInterview() {
    const interviewID = generateUniqueId();

    navigate("/report", {
      state: {
        conversationHistory: conversationHistory,
        leetcodeMatches: leetcodeMatches,
        interviewID: interviewID,
      },
    });
  }

  async function generateStarterCode() {
    const context = `You are conducting a software engineering interview for a software company. 
    Generate starter code that will be present in the IDE on load for the candidate to code in. 
    It should contain an aptly titled function as well as a print statement with 2 or 3 pre-loaded test cases so the candidate may see the output.
    The starter code should be in the following language: ${language.name}.

    Here is an example of starter code and a test case for problem Binary Search. 
    /**
    * Problem: Binary Search: Search a sorted array for a target value.
    */

    function binarySearch(arr, target) {
      /*
      * Your code here
      */
    };

    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const target = 5;
    console.log(binarySearch(arr, target));`;

    let prompt = [
      { role: "system", content: context },
      {
        role: "user",
        content: `This is the problem the candidate will be required to solve: ${leetcodeMatches[0].metadata.title}: ${leetcodeMatches[0].metadata.description}.
        Generate start code for this problem in the target language. Return only the code and nothing else so that it will compile and have no syntax errors. Don't add any markdown elements for styling. Just a string.`,
      },
    ];

    const response = await openai.chat.completions.create({
      messages: prompt,
      model: "gpt-4o-mini",
    });

    if (response.choices[0]) {
      setCode(response.choices[0].message.content);
    }
  }

  async function promptGPT(userMessage) {
    let conversationString = "";
    conversationHistory.map((convo) => {
      conversationString += convo.type + ": " + convo.content + "\n";
    });

    try {
      const context = `Your name is Katie. You are a tech interviewer for a large software company. You are conducting a technical coding interview with a current or recently graduated university student.
      If the student has already given you some of their personal information, do not ask for it again.
      Here is the current conversation history. Use this as context: ${conversationString}
      The problem given to the student is the following problem: ${
        leetcodeMatches ? leetcodeMatches[0].metadata.title : ""
      } ${leetcodeMatches ? leetcodeMatches[0].metadata.description : ""}. 
      The student can see this problem and the visible test cases. You don't ever have to repeat the problem statement in its entirety. You can reference parts of it to answer questions though, of course.
      Consider the optimal solution to the problem. The optimal solution is the one that has the best time and space complexity.
      You are to act as an interviewer, not as AI helping the student. You may subtly nudge the student if their attempt is very far off from the correct answer, but let them do 90% of the work.
      Let them fail if they cannot reach a solution. You are not meant to help the student, but to grade their ability and engage in a discussion about the problem. Don't give hints unless the student asks for them.
      You should encourage the student to talk through their solution, discussing ideas and potential implementations.
      If the student submits code to you, you are to grade it using the test cases in the problem description as well as new test cases you come up with. You don't need to display the test cases, just comment on whether the code passed the test case or not.
      Ask the student what they think the time and space complexity of their implementation is. Have a discussion about it, but do not give them the answer. They must come to the answer themselves.
      Run the students code and tell the student whether or not they passed all the test cases. If they did, but not optimally, ask if there is any room for time or space complexity improvement.
      You should test all edge cases, check for compiler errors, runtime errors, and everything that would prevent the program from working correctly in an IDE.
      If the student submits to you a question or asks for clarification on the problem, do you best to answer, but if the question simply asks you for an implementation or answer, state that that is the job of the student themself.
      Don't include any LaTex style characters in your response. You can only use markdown elements and regular characters.`;

      let userPrompt = [
        { role: "system", content: context },
        {
          role: "user",
          content: userMessage,
        },
      ];

      const response = await openai.chat.completions.create({
        messages: userPrompt,
        model: "gpt-4o-mini",
      });

      const gptResponse = response.choices[0].message.content;

      setConversationHistory((prevHistory) => [
        ...prevHistory,
        { type: "gpt", content: markdownToHTML(gptResponse) },
      ]);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    generateStarterCode();
  }, []);

  useEffect(() => {
    if (outputDetails && outputDetails.stdout) {
      setConversationHistory((prevHistory) => [
        ...prevHistory,
        {
          type: "code",
          content: "Submitted Code (Compiled & Ran Successfully):\n",
          code,
        },
        { type: "output", content: atob(outputDetails.stdout) },
      ]);
    } else if (outputDetails && outputDetails.stderr) {
      setConversationHistory((prevHistory) => [
        ...prevHistory,
        {
          type: "code",
          content: "Submitted Code (Threw Error):\n",
          code,
        },
        { type: "output", content: atob(outputDetails.stderr) },
      ]);
    }

    if (outputDetails) {
      promptGPT(
        "The student just submitted code. The code and output is above. Analyze the correctness and time complexity of the code and discuss with the student."
      );
    }
  }, [outputDetails]);

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
          <div className="absolute z-10 mt-2 w-48 bg-neutral-700 border border-white rounded-md shadow-lg">
            <ul className="text-sm">{formatTopics(topics)}</ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="bg-[#05050D] text-white flex flex-row"
      onMouseMove={resize}
      onMouseUp={() => {
        if (isXResizing) {
          stopXResizing();
        }
        if (isYResizing) {
          stopYResizing();
        }
      }}
      style={{ height: "92vh", width: "100vw" }}
    >
      <div
        className="bg-neutral-800 rounded-lg overflow-y-auto border border-neutral-700 p-4 ml-3 my-3"
        style={{ width: `${problemWidth}%`, minWidth: "20%" }}
      >
        {leetcodeMatches.map((question) => {
          const { title, difficulty, description, url, related_topics } =
            question.metadata;

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
                className="text-blue-400 underline"
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
        className="vertical-bar rounded w-0.5 h-[89vh] bg-neutral-700 hover:bg-blue-500 cursor-col-resize ml-1.5 mt-3 mb-3"
        style={{
          left: `${problemWidth}%`,
        }}
        onMouseDown={startXResizing}
      ></div>
      <div
        className="flex flex-col mr-3"
        style={{ width: `${editorWidth}%`, minWidth: "20%" }}
      >
        <div
          className="rounded-lg bg-neutral-800 border border-neutral-700 ml-1.5 mb-1.5 mt-3"
          style={{ height: `${ideHeight}%` }}
        >
          <Compiler
            editorHeight={0.8 * ideHeight}
            editorWidth={editorWidth - 10}
            code={code}
            setCode={setCode}
            language={language}
            setLanguage={setLanguage}
            outputDetails={outputDetails}
            setOutputDetails={setOutputDetails}
          />
        </div>
        <div
          className="rounded h-0.5 bg-neutral-700 hover:bg-blue-500 cursor-row-resize ml-2 mb-1.5"
          onMouseDown={startYResizing}
        ></div>
        <div
          className="relative rounded-lg bg-neutral-800 border border-neutral-700 ml-1.5 mb-3 flex flex-col"
          style={{
            height: `${95 - ideHeight}%`,
          }}
        >
          <div className="p-2 overflow-y-auto flex-grow">
            {conversationHistory.map((msg, index) => {
              if (msg.type !== "code" && msg.type !== "output") {
                return (
                  <div
                    key={index}
                    className={`py-1 whitespace-pre-wrap break-words ${
                      msg.type === "gpt" ? "text-blue-300" : "text-green-300"
                    }`}
                  >
                    {msg.content}
                  </div>
                );
              } else if (msg.type === "output") {
                return (
                  <div
                    key={index}
                    className={`py-1 whitespace-pre-wrap break-words ${
                      msg.type === "gpt" ? "text-blue-300" : "text-green-300"
                    }`}
                  >
                    {"OUTPUT: \n" + msg.content}
                  </div>
                );
              } else {
                return "";
              }
            })}
          </div>
          <div className="rounded-lg bottom-0 left-0 w-full p-2 bg-neutral-800 flex-shrink-0">
            <input
              onKeyDown={async (event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  let temp = event.target.value;
                  event.target.value = "";
                  setConversationHistory((prevHistory) => [
                    ...prevHistory,
                    { type: "user", content: temp },
                  ]);
                  await promptGPT(temp);
                }
              }}
              className="w-full p-2 rounded-lg border border-neutral-700 bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Talk to your interviewer..."
              style={{ "--placeholder-color": "#a0aec0" }}
            />
          </div>
        </div>
      </div>
      <style jsx>{`
        code {
          background-color: #333;
          border-radius: 5px;
          padding: 2px 5px;
          font-family: "Courier New", Courier, monospace;
          color: #e0e0e0;
        }
        .no-select {
          user-select: none;
        }
        .overflow-y-scroll {
          overflow-y: scroll;
        }
        .overflow-x-hidden {
          overflow-x: hidden;
          word-wrap: break-word;
        }
        input::placeholder {
          color: var(--placeholder-color);
        }
      `}</style>
    </div>
  );
}
