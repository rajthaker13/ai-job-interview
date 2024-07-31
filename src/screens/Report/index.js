import React, { useEffect, useState, useRef } from "react";
import { ProgressCircle, ProgressBar } from "@tremor/react";
import OpenAI from "openai";

import { useLocation, useNavigate } from "react-router-dom";

export default function Report(props) {
  const openai = new OpenAI({
    apiKey: "sk-proj-bDhKwBhyKB0Del1D2IiPT3BlbkFJCAoB10kc39MQMqI5pD2V",
    dangerouslyAllowBrowser: true,
  });

  const [selectedDiv, setSelectedDiv] = useState(null);
  const [radius, setRadius] = useState(calculateRadius());

  // Function to calculate radius based on viewport size
  function calculateRadius() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    // Adjust the radius calculation as needed
    const radius = Math.min(width, height) * 0.1;
    return radius;
  }

  const navigate = useNavigate();
  const location = useLocation();
  const { conversationHistory, leetcodeMatches, interviewID } =
    location.state || {};

  const [technicalScores, setTechnicalScores] = useState([]);
  const [verbalScores, setVerbalScores] = useState([]);
  const [overallScore, setOverallScore] = useState(0);
  const [scoreDiscussion, setScoreDicussion] = useState([]);
  const [firstLoad, setFirstLoad] = useState(true);

  const [shouldUpload, setShouldUpload] = useState(true);

  async function chatWithCoach(userMessage) {
    let conversationString = "";
    conversationHistory.map((convo) => {
      conversationString += convo.type + ": " + convo.content + "\n";
    });

    let discussionString = "";
    scoreDiscussion.map((convo) => {
      discussionString += convo.type + ": " + convo.content + "\n";
    });

    try {
      const context = `You are a techincal/software engineering interview coach. You are reviewing the transcript of a technical coding interview with a current or recently graduated university student.
      Here is the transcript of the interview. Use this as context: ${conversationString}

      Here is a list of attributes they were graded on. The first set of attributes are technical, and the second set are behavioral attributes.
      ${technicalScores} ${verbalScores}

      Here is your current conversation with the student: ${discussionString}. Help the student improve their ability to succeed in technical interviews. Answer their questions and provide advice on how to improve in technical aspects as well as behavioral aspects.
      `;

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

      setScoreDicussion((prevHistory) => [
        ...prevHistory,
        { type: "gpt", content: markdownToHTML(gptResponse) },
      ]);
      setShouldUpload(true);
    } catch (error) {
      console.log(error);
    }
  }

  async function generateReport() {
    let conversationString = "";
    if (conversationHistory[0]) {
      conversationHistory.map((convo) => {
        conversationString += convo.type + ": " + convo.content + "\n";
      });
    }

    if (!conversationHistory[1]) {
      return;
    }

    try {
      const context = `Your name is Katie. You are a tech interviewer for a large software company. You have just completed a technical interview with the student. 
      Here was the problem: 
      ${leetcodeMatches ? leetcodeMatches[0].metadata.title : ""} ${
        leetcodeMatches ? leetcodeMatches[0].metadata.description : ""
      }. 
      Consider the optimal solution to the problem. The optimal solution is the one that has the best time and space complexity.
      The student should have been talking through their solution, discussing ideas and potential implementations.
      Here is a transcript of the interview. The student is "user" and you, the interviewer, are "gpt":
      ${conversationString}
      Consider the last version of code that the student submitted to you. You are to grade it using the test cases in the problem description as well as new test cases you come up with. If the student did not submit code, their score should be zero.
      Your task now is to generate a report for the student. This interview was just a practice mock interview, so you are to provide feedback that would most help the student in their interview preparation.
      Consider the process the student took to arrive at the answer. Consider whether their answers were correct or not. Consider how much the student engaged in dialogue with you and showed you their though process.
      If you are asked for numerical metrics or score, your response should be an integer, so that it can be easily parsed.
      If you are asked for a text-based answer, your response should be short, easily readable, and you should always address the student directly, for example: 
      "You need practice with dynamic programming style questions. I recommend you do more problems similar to the one you saw in the interview today."
      `;

      let technicalPrompt = [
        { role: "system", content: context },
        {
          role: "user",
          content:
            "Based on the converstion, generate 4 technical categories to score the applicant on. These categories should not cover behavioral topics like communication. One of these categories should be 'Code', but the other two should by picked based on what was convered in the interview. For example, if the student was asked about the time and space complexity of their program, a relevant category to score them on might be 'Big-O'. Be creative and make it customized to the interview. All scores should be out of 100. Don't return scores in multiples of 5. Category names should be maximum 3 words. Return your answer in the following format and nothing else: [{name: String, score: int}, {name: String, score: int}, {name: String, score: int}]. All keys must be enclosed in double quotes to conform to JSON.parse function.",
        },
      ];

      const technicalResponse = await openai.chat.completions.create({
        messages: technicalPrompt,
        model: "gpt-4",
      });

      setTechnicalScores(
        JSON.parse(technicalResponse.choices[0].message.content)
      );

      let verbalPrompt = [
        { role: "system", content: context },
        {
          role: "user",
          content:
            "Based on the converstion, generate 4 behavioral categories to score the applicant on. These should be non-technical and not be related coding or problem-solving. The student should be actively engaging with the interviewer throughout the interview, showing them their thought process. The student should also demonstrate the kind of team member they would be should they be hired. The categories should by picked based on what was convered in the interview. Be creative and make it customized to the interview. All scores should be out of 100. Do not return scores in multiples of 5. If the student is rude, mostly silent, or dismissive, dock their score significantly. It requires excellent communication skills, abundant kindness, and detailed insights into their thinking process to achieve a score near 100. Category names should be maximum 3 words. Return your answer in the following format and nothing else: [{name: String, score: int}, {name: String, score: int}, {name: String, score: int}]. All keys must be enclosed in double quotes to conform to JSON.parse function.",
        },
      ];

      const verbalResponse = await openai.chat.completions.create({
        messages: verbalPrompt,
        model: "gpt-4",
      });

      setVerbalScores(JSON.parse(verbalResponse.choices[0].message.content));

      let overallPrompt = [
        { role: "system", content: context },
        {
          role: "user",
          content:
            "Generate an overall score out of 100 for the interview based on code correctness, code optimality, knowledge of big-O concepts, engagement with the interviewer, general problem solving skills, and pleasant attitude. If the student did not participate in the interview, return 0. Don't be afraid to weigh the behavioral aspects of the interview significantly. If the student is rude, mostly silent, or dismissive, dock their score significantly even if their code was correct. Return only an integer, nothing else.",
        },
      ];

      const overallResponse = await openai.chat.completions.create({
        messages: overallPrompt,
        model: "gpt-4",
      });

      setOverallScore(overallResponse.choices[0].message.content);

      let discussionPrompt = [
        { role: "system", content: context },
        {
          role: "user",
          content: `Write a list of 4 bullet-points highlighting the 4 most important points to help the student. Put line breaks between each bullet-point. You should focus 3 points on how the student can improve, and 1 point highlighting their strongest strength in the interview. These are the student's grades in specific categories: ${technicalScores} ${verbalScores} Return only these 4 bullet-points and nothing else. Each bullet-point should start a with title in bold, followed by an explanation`,
        },
      ];

      const discussionResponse = await openai.chat.completions.create({
        messages: discussionPrompt,
        model: "gpt-4o",
      });

      setScoreDicussion([
        ...scoreDiscussion,
        {
          type: "gpt",
          content: markdownToHTML(
            discussionResponse.choices[0].message.content
          ),
        },
      ]);
    } catch (error) {
      console.log(error);
    }
  }

  async function uploadReport() {
    const uid = localStorage.getItem("uid");
    let conversationString = "";
    if (conversationHistory[0]) {
      conversationHistory.map((convo) => {
        conversationString += convo.type + ": " + convo.content + "\n";
      });
    }

    setShouldUpload(false);

    const { data, error } = await props.db
      .from("users")
      .select()
      .eq("uid", uid);

    let newInterview = {
      id: interviewID,
      transcript: conversationString,
      questions: leetcodeMatches,
      report: {
        overallScore: overallScore,
        technicalScores: technicalScores,
        verbalScores: verbalScores,
        scoreDiscussion: scoreDiscussion,
      },
    };

    if (data && data[0]) {
      let update_package = [...data[0].interviews];

      // Find the index of the existing interview with the same id
      const index = update_package.findIndex(
        (interview) => interview.id === newInterview.id
      );

      if (index !== -1) {
        // If the interview exists, update it
        update_package[index] = newInterview;
      } else {
        // If the interview doesn't exist, add it
        update_package.push(newInterview);
      }

      await props.db
        .from("users")
        .update({
          interviews: update_package,
        })
        .eq("uid", uid);
    } else {
      let update_package = [];

      update_package.push(newInterview);

      await props.db.from("users").insert({
        uid: uid,
        interviews: update_package,
      });
    }
  }

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

  // Function to determine difficulty color
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

  function parseProblems(str) {
    // Regular expression to match the pattern
    const problemPattern = /\[([^,]+), ([^,]+), ([^\]]+)\]/g;
    const problems = [];
    let match;

    // Iterate through all matches of the pattern in the string
    while ((match = problemPattern.exec(str)) !== null) {
      // Push an object with the extracted information to the problems array
      problems.push({
        name: match[1].trim(),
        url: `https://leetcode.com${match[2].trim()}`,
        level: match[3].trim(),
      });
    }

    return problems;
  }

  useEffect(() => {
    if (firstLoad) {
      setFirstLoad(false);
      generateReport();
    }

    if (
      (verbalScores.length != 0) != [] &&
      (technicalScores.length != 0) != [] &&
      overallScore != 0 &&
      scoreDiscussion.length != 0 &&
      shouldUpload
    ) {
      uploadReport();
    }

    const handleResize = () => {
      setRadius(calculateRadius());
    };

    // Set the initial radius
    setRadius(calculateRadius());

    // Add resize event listener
    window.addEventListener("resize", handleResize);
  });

  return (
    <div
      className="bg-[#05050D] text-white flex-col"
      style={{ height: "100vh", width: "100vw" }}
    >
      <p className="font-bold text-4xl pl-6 pt-6 pb-3">Your Interview Report</p>
      <div className="flex justify-center mt-5">
        <div
          className="flex-col w-[40vw] ml-5"
          onMouseEnter={() => {
            setSelectedDiv("technical");
          }}
          onMouseLeave={() => {
            setSelectedDiv("");
          }}
        >
          <div
            className={`bg-neutral-700 border-t border-l border-r ${
              selectedDiv == "technical"
                ? "border-neutral-500"
                : "border-neutral-700"
            } h-[5vh]`}
            style={{
              borderTopLeftRadius: "10px",
              borderTopRightRadius: "10px",
              borderBottomRightRadius: "0",
              borderBottomLeftRadius: "0",
            }}
          >
            <p className="p-2 font-bold">Technical Score</p>
          </div>
          <div
            className={`bg-neutral-800 border-b border-l border-r ${
              selectedDiv == "technical"
                ? "border-neutral-500"
                : "border-neutral-700"
            } h-[30vh] flex justify-center overflow-y-auto`}
            style={{
              borderTopLeftRadius: "0",
              borderTopRightRadius: "0",
              borderBottomRightRadius: "10px",
              borderBottomLeftRadius: "10px",
            }}
          >
            <div className="flex-col p-4 w-full">
              {technicalScores.map((obj, index) => (
                <div className="flex items-center w-full py-4" key={index}>
                  <p className="flex-grow text-left font-bold">{obj.name}</p>
                  <p className="w-12 text-center mr-20">{`${obj.score}/100`}</p>
                  <ProgressBar
                    value={obj.score}
                    color={"teal"}
                    className="w-[40%]"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div
          className="flex-col w-[40vw] ml-3"
          onMouseEnter={() => {
            setSelectedDiv("verbal");
          }}
          onMouseLeave={() => {
            setSelectedDiv("");
          }}
        >
          <div
            className={`bg-neutral-700 border-t border-l border-r ${
              selectedDiv == "verbal"
                ? "border-neutral-500"
                : "border-neutral-700"
            } h-[5vh]`}
            style={{
              borderTopLeftRadius: "10px",
              borderTopRightRadius: "10px",
              borderBottomRightRadius: "0",
              borderBottomLeftRadius: "0",
            }}
          >
            <p className="p-2 font-bold">Verbal Score</p>
          </div>
          <div
            className={`bg-neutral-800 border-b border-l border-r ${
              selectedDiv == "verbal"
                ? "border-neutral-500"
                : "border-neutral-700"
            } h-[30vh] flex justify-center overflow-y-auto`}
            style={{
              borderTopLeftRadius: "0",
              borderTopRightRadius: "0",
              borderBottomRightRadius: "10px",
              borderBottomLeftRadius: "10px",
            }}
          >
            <div className="flex-col p-4 w-full">
              {verbalScores.map((obj, index) => (
                <div className="flex items-center w-full py-4" key={index}>
                  <p className="flex-grow text-left font-bold">{obj.name}</p>
                  <p className="w-12 text-center mr-20">{`${obj.score}/100`}</p>
                  <ProgressBar
                    value={obj.score}
                    color={"amber"}
                    className="w-[40%]"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div
          className="flex-col w-[20vw] ml-3 mr-5"
          onMouseEnter={() => {
            setSelectedDiv("overall");
          }}
          onMouseLeave={() => {
            setSelectedDiv("");
          }}
        >
          <div
            className={`bg-neutral-700 border-t border-l border-r ${
              selectedDiv == "overall"
                ? "border-neutral-500"
                : "border-neutral-700"
            } h-[5vh]`}
            style={{
              borderTopLeftRadius: "10px",
              borderTopRightRadius: "10px",
              borderBottomRightRadius: "0",
              borderBottomLeftRadius: "0",
            }}
          >
            <p className="p-2 font-bold">Overall</p>
          </div>
          <div
            className={`bg-neutral-800 border-b border-l border-r ${
              selectedDiv == "overall"
                ? "border-neutral-500"
                : "border-neutral-700"
            } h-[30vh] flex items-center justify-center`}
            style={{
              borderTopLeftRadius: "0",
              borderTopRightRadius: "0",
              borderBottomRightRadius: "10px",
              borderBottomLeftRadius: "10px",
            }}
          >
            <ProgressCircle
              value={overallScore}
              color={"fuchsia"}
              radius={radius}
              strokeWidth={6}
            >
              <span className="text-white text-3xl font-bold">
                {overallScore}
              </span>
            </ProgressCircle>
          </div>
        </div>
      </div>
      <div className="flex justify-center mt-3">
        <div
          className="flex-col w-[75vw] ml-5"
          onMouseEnter={() => {
            setSelectedDiv("feedback");
          }}
          onMouseLeave={() => {
            setSelectedDiv("");
          }}
        >
          <div
            className={`bg-neutral-700 border-t border-l border-r ${
              selectedDiv == "feedback"
                ? "border-neutral-500"
                : "border-neutral-700"
            } h-[5vh]`}
            style={{
              borderTopLeftRadius: "10px",
              borderTopRightRadius: "10px",
              borderBottomRightRadius: "0",
              borderBottomLeftRadius: "0",
            }}
          >
            <p className="p-2 font-bold">Coach's Report</p>
          </div>
          <div
            className={`bg-neutral-800 border-l border-r ${
              selectedDiv == "feedback"
                ? "border-neutral-500"
                : "border-neutral-700"
            } h-[35vh] flex px-5 py-2 overflow-y-auto`}
          >
            <div className="flex-col">
              {scoreDiscussion.map((msg, index) => (
                <p
                  key={index}
                  dangerouslySetInnerHTML={{
                    __html: msg.content,
                  }}
                  className={`py-1 whitespace-pre-wrap break-words ${
                    msg.type === "gpt" ? "text-blue-300" : "text-white-300"
                  }`}
                ></p>
              ))}
            </div>
          </div>
          <div
            className={`bg-neutral-800 border-b border-l border-r ${
              selectedDiv == "feedback"
                ? "border-neutral-500"
                : "border-neutral-700"
            } bottom-0 left-0 w-full p-2 bg-neutral-800`}
            style={{
              borderTopLeftRadius: "0px",
              borderTopRightRadius: "0px",
              borderBottomRightRadius: "10px",
              borderBottomLeftRadius: "10px",
            }}
          >
            <input
              onKeyDown={async (event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  let temp = event.target.value;
                  event.target.value = "";
                  setScoreDicussion((prevHistory) => [
                    ...prevHistory,
                    { type: "user", content: markdownToHTML(temp) },
                  ]);
                  await chatWithCoach(temp);
                }
              }}
              className="w-full h-[5vh] rounded-lg border border-neutral-700 bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ask for more feedback..."
              style={{ "--placeholder-color": "#a0aec0" }}
            />
          </div>
        </div>
        <div
          className="flex-col w-[25vw] ml-3 mr-5"
          onMouseEnter={() => {
            setSelectedDiv("problems");
          }}
          onMouseLeave={() => {
            setSelectedDiv("");
          }}
        >
          <div
            className={`bg-neutral-700 border-t border-l border-r ${
              selectedDiv == "problems"
                ? "border-neutral-500"
                : "border-neutral-700"
            } h-[5vh]`}
            style={{
              borderTopLeftRadius: "10px",
              borderTopRightRadius: "10px",
              borderBottomRightRadius: "0",
              borderBottomLeftRadius: "0",
            }}
          >
            <p className="p-2 font-bold">Similar Questions</p>
          </div>
          <div
            className={`bg-neutral-800 border-b border-l border-r ${
              selectedDiv == "problems"
                ? "border-neutral-500"
                : "border-neutral-700"
            } h-[42vh] flex items-start justify-start overflow-y-auto`}
            style={{
              borderTopLeftRadius: "0",
              borderTopRightRadius: "0",
              borderBottomRightRadius: "10px",
              borderBottomLeftRadius: "10px",
            }}
          >
            <div className="p-4 w-full">
              {leetcodeMatches &&
                parseProblems(
                  leetcodeMatches[0].metadata.similar_questions
                ).map((problem, index) => (
                  <div key={index} className="flex items-center mb-4">
                    <a
                      href={problem.url}
                      className="font-bold pr-3 block"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {problem.name}
                    </a>
                    <div
                      className={`inline-block rounded-full bg-neutral-700 px-2 py-1 ${getDifficultyColor(
                        problem.level
                      )}`}
                    >
                      {problem.level}
                    </div>
                  </div>
                ))}
            </div>
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
        .overflow-y-scroll {
          overflow-y: scroll;
        }
        .overflow-x-hidden {
          overflow-x: hidden;
          word-wrap: break-word;
        }
        h1 {
          font-size: 1.75em;
          font-weight: bold;
        }

        h2 {
          font-size: 1.5em;
          font-weight: bold;
        }

        h3 {
          font-size: 1.25em;
          font-weight: bold;
        }

        h4 {
          font-size: 1em;
          font-weight: bold;
        }

        h5 {
          font-size: 0.875em;
          font-weight: bold;
        }

        h6 {
          font-size: 0.75em;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
}
