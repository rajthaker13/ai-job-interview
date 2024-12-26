import OpenAI from "openai";
import { TextInput, Button, Dialog, DialogPanel } from "@tremor/react";
import { RiSearch2Line } from "@remixicon/react";
import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { languageOptions } from "../../components/Editor/constants/languageOptions";
import Compiler from "../../components/Editor/Compiler";
import gptPic from "../../assets/favicon.png";
import userPic from "../../assets/user.png";

export default function Interview(props) {
  const openai = new OpenAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY,
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
      content: "Hello! I'm your coding assistant. I'll help you solve the problems and provide feedback on your code. Feel free to ask questions about the problem or get hints if you're stuck. Let's begin with the first question!",
    },
  ]);
  const [code, setCode] = useState("");
  const [outputDetails, setOutputDetails] = useState(null);
  const [language, setLanguage] = useState(languageOptions[0]);
  const [questionIndex, setQuestionIndex] = useState(0);

  const isXResizing = useRef(false);
  const startX = useRef(0);

  const isYResizing = useRef(false);
  const startY = useRef(0);

  const location = useLocation();
  const leetcodeMatches = location.state || {};

  const [testCasesPassed, setTestCasesPassed] = useState(false);
  const [timeComplexityDiscussed, setTimeComplexityDiscussed] = useState(false);

  const isQuestionComplete = () => {
    return testCasesPassed && timeComplexityDiscussed;
  };

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
        Math.min(55, problemWidth + (deltaX / window.innerWidth) * 100)
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

    // Convert Markdown headers to HTML headers
    formattedText = formattedText.replace(
      /###### (.*?)(<br>|$)/g,
      "<h6>$1</h6>$2"
    );
    formattedText = formattedText.replace(
      /##### (.*?)(<br>|$)/g,
      "<h5>$1</h5>$2"
    );
    formattedText = formattedText.replace(
      /#### (.*?)(<br>|$)/g,
      "<h4>$1</h4>$2"
    );
    formattedText = formattedText.replace(
      /### (.*?)(<br>|$)/g,
      "<h3>$1</h3>$2"
    );
    formattedText = formattedText.replace(/## (.*?)(<br>|$)/g, "<h2>$1</h2>$2");
    formattedText = formattedText.replace(/# (.*?)(<br>|$)/g, "<h1>$1</h1>$2");

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
        className={`py-1 px-2 ${index < array.length - 1 ? "border-b border-gray-300" : ""
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
    Do not give hints with the starter code, all functions and constructors should be blank inside. And classes should not have instance variables.
    The starter code should be in the following language: ${language.name}.
    Include common import/library statements so the candidate can use Lists, HashMaps, HashSets, Stacks, Queues, and other common data structures. 
    If the language is Java, the class should be named "Main".

    Here is an example of starter code in JavaScript and a test case for problem Binary Search. 
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
        content: `This is the problem the candidate will be required to solve: ${leetcodeMatches[questionIndex].metadata.title}: ${leetcodeMatches[questionIndex].metadata.description}.
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

  useEffect(() => {
    console.log("Q", leetcodeMatches[questionIndex]);
  }, []);

  async function promptGPT(userMessage) {
    try {
      const context = `You are a coding assistant helping with technical programming questions.
      Current problem: ${leetcodeMatches[questionIndex]?.metadata?.title}
      Your role is to:
      1. Answer specific questions about the problem
      2. Provide hints without giving away the solution
      3. Help debug code issues
      4. Suggest optimization techniques
      
      Keep responses focused on the technical problem. Don't ask personal questions.`;

      let userPrompt = [
        { role: "system", content: context },
        { role: "user", content: userMessage },
      ];

      const response = await openai.chat.completions.create({
        messages: userPrompt,
        model: "gpt-4o-mini",
      });

      const gptResponse = response.choices[0].message.content;

      if (testCasesPassed && gptResponse.includes("Great job! You've completed this question successfully.")) {
        setTimeComplexityDiscussed(true);
      }

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
  }, [language, questionIndex]);

  // Add state for success modal
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Function to handle moving to next question
  const moveToNextQuestion = () => {
    setQuestionIndex(prev => prev + 1);
    setCode(""); // Reset code
    setTestCasesPassed(false); // Reset test case state
    setOutputDetails(null); // Reset output details
    generateStarterCode(); // Generate new starter code
  };

  // Function to analyze test cases with OpenAI
  async function analyzeTestCases(outputDetails, code) {
    try {
      const currentQuestion = leetcodeMatches[questionIndex];
      const context = `You are a code test case analyzer for LeetCode problems. 
      
      Problem: ${currentQuestion.metadata.title}
      Description: ${currentQuestion.metadata.description}
      Difficulty: ${currentQuestion.metadata.difficulty}
      
      User's Code:
      ${code}
      
      Code Output:
      ${atob(outputDetails.stdout)}
      
      Your task is to determine if this code correctly solves the problem and passes all test cases.
      Consider:
      1. Does the output match the expected format?
      2. Does the solution handle all edge cases mentioned in the problem?
      3. Does the code solve the core problem correctly?
      
      Return ONLY a JSON object in this exact format: {"passed": true/false, "reason": "brief explanation of why the code passed or failed"}`;

      const response = await openai.chat.completions.create({
        messages: [
          { role: "system", content: "You are a strict LeetCode problem validator." },
          { role: "user", content: context }
        ],
        model: "gpt-4o-mini",
        temperature: 0.1
      });

      try {
        const analysis = JSON.parse(response.choices[0].message.content.trim());
        return analysis;
      } catch (parseError) {
        console.error("Failed to parse OpenAI response:", parseError);
        return { passed: false, reason: "Error analyzing test cases" };
      }
    } catch (error) {
      console.error("Error analyzing test cases:", error);
      return { passed: false, reason: "Error analyzing test cases" };
    }
  }

  // Updated handleCodeFeedback function
  async function handleCodeFeedback(outputDetails) {
    if (!outputDetails) return;
    console.log("OUTPUT", outputDetails);

    // Add raw output to chat
    setConversationHistory(prev => [...prev, {
      type: "output",
      content: `<b>Code Output:</b>${atob(outputDetails.stdout)}`
    }]);

    // Analyze test cases with OpenAI using the current code
    const analysis = await analyzeTestCases(outputDetails, code);

    if (analysis.passed) {
      // Add success message to chat
      setConversationHistory(prev => [...prev, {
        type: "success",
        content: "🎉 All test cases passed! Great job with this solution."
      }]);

      // Wait 2 seconds to show the success message before showing modal
      setTimeout(() => {
        setShowSuccessModal(true);

        // Wait 3 more seconds then move to next question or end interview
        setTimeout(() => {
          setShowSuccessModal(false);
          if (questionIndex === 2) {
            endInterview();
          } else {
            moveToNextQuestion();
          }
        }, 3000);
      }, 2000);
    } else {
      // Provide specific feedback based on AI analysis
      let feedbackMessage = "<b>Code Analysis:</b><br>";
      feedbackMessage += `❌ ${analysis.reason}<br><br>`;
      feedbackMessage += "Consider:<br>";
      feedbackMessage += "- Review the problem requirements carefully<br>";
      feedbackMessage += "- Test your solution against the example cases<br>";
      feedbackMessage += "- Check for any edge cases in your implementation";

      setConversationHistory(prev => [...prev, {
        type: "error",
        content: feedbackMessage
      }]);
    }
  }

  // Update the useEffect that handles output
  useEffect(() => {
    if (outputDetails && outputDetails.stdout) {
      handleCodeFeedback(outputDetails);
    }
  }, [outputDetails]);

  // Add useEffect to handle question changes
  useEffect(() => {
    setTestCasesPassed(false);
    setOutputDetails(null);

  }, [questionIndex]);

  // Add ref for chat container
  const chatContainerRef = useRef(null);

  // Add scroll to bottom function
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  // Add useEffect to scroll when conversation history updates
  useEffect(() => {
    scrollToBottom();
  }, [conversationHistory]);

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
      className="bg-[#05050D] min-h-screen pt-16"
      onMouseMove={resize}
      onMouseUp={() => {
        if (isXResizing) {
          stopXResizing();
        }
        if (isYResizing) {
          stopYResizing();
        }
      }}
    >
      <div className="h-[calc(100vh-64px)] flex flex-col px-8">
        <div className="flex flex-1 gap-6 h-full overflow-hidden">
          {/* Left Panel - Problem Description */}
          <div
            className="bg-[#0D0D1A] rounded-xl border border-gray-800 overflow-y-auto"
            style={{ width: `${problemWidth}%`, minWidth: "30%" }}
            onClick={() => setSelectedDiv("problem")}
          >
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-white">
                  {leetcodeMatches[questionIndex]?.metadata?.title}
                </h2>
                <span className={`px-3 py-1 rounded-lg text-sm font-medium ${leetcodeMatches[questionIndex]?.metadata?.difficulty === "Easy" ? "bg-green-500/20 text-green-400" :
                  leetcodeMatches[questionIndex]?.metadata?.difficulty === "Medium" ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-red-500/20 text-red-400"
                  }`}>
                  {leetcodeMatches[questionIndex]?.metadata?.difficulty}
                </span>
              </div>
              <a
                href={leetcodeMatches[questionIndex]?.metadata?.url}
                className="text-blue-400 hover:text-blue-300 transition-colors duration-200 text-sm"
                target="_blank"
                rel="noopener noreferrer"
              >
                View on Leetcode
              </a>
            </div>
            <div className="p-4">
              <div className="prose prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{
                  __html: formatDescription(leetcodeMatches[questionIndex]?.metadata?.description)
                }} />
              </div>
            </div>
          </div>

          {/* Vertical Resize Bar */}
          <div
            className="w-1 hover:bg-blue-500 cursor-col-resize bg-gray-800 rounded"
            onMouseDown={startXResizing}
          />

          {/* Right Panel - Editor and Chat */}
          <div
            className="flex flex-col h-full"
            style={{ width: `${editorWidth}%`, minWidth: "45%" }}
            onClick={() => setSelectedDiv("editor")}
          >
            {/* Code Editor Container */}
            <div
              className="bg-[#0D0D1A] rounded-xl border border-gray-800 overflow-hidden"
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
                questionIndex={questionIndex}
                setQuestionIndex={setQuestionIndex}
                endInterview={endInterview}
              />
            </div>

            {/* Horizontal Resize Bar */}
            <div
              className="h-1 my-3 hover:bg-blue-500 cursor-row-resize bg-gray-800 rounded"
              onMouseDown={startYResizing}
            />

            {/* Chat Interface */}
            <div
              className="flex flex-col bg-[#0D0D1A] rounded-xl border border-gray-800 overflow-hidden"
              style={{ height: `${95 - ideHeight}%` }}
              onClick={() => setSelectedDiv("chat")}
            >
              <div className="p-4 border-b border-gray-800">
                <h2 className="text-xl font-semibold text-white">Interview Chat</h2>
              </div>

              {/* Add ref to the chat container */}
              <div className="flex-1 overflow-y-auto" ref={chatContainerRef}>
                <div className="p-4 space-y-4">
                  {conversationHistory.map((msg, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg ${msg.type === "gpt"
                        ? "bg-blue-500/10 border border-blue-500/20"
                        : msg.type === "user"
                          ? "bg-purple-500/10 border border-purple-500/20"
                          : msg.type === "error"
                            ? "bg-red-500/10 border border-red-500/20"
                            : "bg-green-500/10 border border-green-500/20"
                        }`}
                    >
                      <p
                        dangerouslySetInnerHTML={{ __html: msg.content }}
                        className="text-gray-300 whitespace-pre-wrap break-words"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 border-t border-gray-800 bg-[#0D0D1A] rounded-b-xl">
                <input
                  type="text"
                  placeholder="Talk to your interviewer..."
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
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
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <Dialog
        open={showSuccessModal}
        onClose={() => { }}
        static={true}
      >
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <DialogPanel className="bg-[#0D0D1A] border border-green-500/20 p-6 rounded-xl max-w-md mx-auto transform transition-all">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 bg-green-500/20 p-3 rounded-full">
                <svg
                  className="w-8 h-8 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Question Completed Successfully!
              </h3>
              <p className="text-gray-400 mb-4">
                {questionIndex === 2
                  ? "Great job! Preparing your interview report..."
                  : "Moving to the next question..."}
              </p>
              <div className="animate-pulse flex space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              </div>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
