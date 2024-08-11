import React, { useEffect, useState } from "react";
import { ProgressCircle } from "@tremor/react";
import OpenAI from "openai";
import { useLocation, useNavigate } from "react-router-dom";
import { Pinecone } from "@pinecone-database/pinecone";
import { Button, Dialog, DialogPanel } from "@tremor/react";

export default function Profile(props) {
  const openai = new OpenAI({
    apiKey: "sk-proj-bDhKwBhyKB0Del1D2IiPT3BlbkFJCAoB10kc39MQMqI5pD2V",
    dangerouslyAllowBrowser: true,
  });

  const pinecone = new Pinecone({
    apiKey: process.env.REACT_APP_LINK_PINECONE_KEY,
  });

  const navigate = useNavigate();

  const [selectedDiv, setSelectedDiv] = useState(null);
  const [radius, setRadius] = useState(calculateRadius());

  const [interviews, setInterviews] = useState([]);
  const [overallScore, setOverallScore] = useState(0);
  const [scoreDiscussion, setScoreDicussion] = useState([
    {
      type: "gpt",
      content:
        "<h3>Hello!</h3>I'm your personal interview coach. I have access to all of your previous interviews, so I can notice trends in your performance and provide you with holistic advice. Ask me anything!",
    },
  ]);
  const [reportString, setReportString] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [jobDescription, setJobDescription] = useState("");

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

  // Function to calculate radius based on viewport size
  function calculateRadius() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    // Adjust the radius calculation as needed
    const radius = Math.min(width, height) * 0.1;
    return radius;
  }

  function seeReport(interviewID, leetcodeMatches, conversationHistory) {
    navigate("/report", {
      state: {
        conversationHistory: conversationHistory,
        leetcodeMatches: leetcodeMatches,
        interviewID: interviewID,
      },
    });
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: "numeric", month: "long", day: "numeric" };
    let formatted = date.toLocaleDateString("en-US", options);

    // Add the ordinal suffix to the day
    const day = date.getDate();
    const suffix = getOrdinalSuffix(day);
    formatted = formatted.replace(/\d+/, day + suffix);

    return formatted;
  }

  function getOrdinalSuffix(day) {
    if (day > 3 && day < 21) return "th";
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  }

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

  async function getLeetcodeProblems() {
    setOpenModal(false);
    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: `${jobDescription}`,
    });
    const index = pinecone.index("leetcode-problems");

    const ns1 = index.namespace("version-1");

    const matchingProblems = await ns1.query({
      topK: 3,
      vector: embedding.data[0].embedding,
      includeMetadata: true,
      filter: {
        description: { $ne: "SQL Schema" },
      },
    });

    setJobDescription("");
    navigate("/interview", { state: matchingProblems.matches });
  }

  async function getUserData() {
    const uid = localStorage.getItem("uid");

    try {
      const { data, error } = await props.db
        .from("users")
        .select()
        .eq("uid", uid);

      if (data && data[0]) {
        setInterviews(data[0].interviews);
        let overall = 0;
        let tempString = "";
        for (const interview of data[0].interviews) {
          overall += parseInt(interview.report.overallScore);
          tempString += "\nNew Interview";
          tempString += "\nOverall Score: " + interview.report.overallScore;
          tempString +=
            "\nTechnical Scores: " +
            JSON.stringify(interview.report.technicalScores);
          tempString +=
            "\nBehavioral Scores: " +
            JSON.stringify(interview.report.verbalScores);
          tempString +=
            "\nInterview Analysis: " +
            JSON.stringify(interview.report.scoreDiscussion);
        }
        setReportString(tempString);
        setOverallScore(Math.round(overall / data[0].interviews.length));
      }
    } catch (error) {}
  }

  async function chatWithCoach(userMessage) {
    let discussionString = "";
    scoreDiscussion.map((convo) => {
      discussionString += convo.type + ": " + convo.content + "\n";
    });

    try {
      const context = `You are a techincal/software engineering interview coach. You are reviewing the scores of multiple technical coding interviews with a current or recently graduated university student.
      Here is an overview of their interviews, if the overview is blank, it is because the student hasn't done any interviews: ${reportString}

      Here is your current conversation with the student: ${discussionString}. Help the student improve their ability to succeed in technical interviews. Answer their questions and provide advice on how to improve in technical aspects as well as behavioral aspects. Be succint, don't write multiple paragraphs if unnecessary. Space out your answer. Don't just write a block of text, frequently use bullet point lists and line breaks.
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
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    getUserData();
  }, []);

  useEffect(() => {
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
      className="bg-[#05050D] text-white flex-col pt-1 pb-3"
      style={{ height: "92vh", width: "100vw" }}
    >
      <div className="flex justify-center mt-5">
        <div
          className="flex-col w-[40vw] ml-5"
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
            } h-[75vh] flex px-5 py-2 overflow-y-auto`}
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
              placeholder="Chat with your coach..."
              style={{ "--placeholder-color": "#a0aec0" }}
            />
          </div>
        </div>
        <div
          className="flex-col w-[50vw] ml-3"
          onMouseEnter={() => {
            setSelectedDiv("reports");
          }}
          onMouseLeave={() => {
            setSelectedDiv("");
          }}
        >
          <div
            className={`bg-neutral-700 border-t border-l border-r ${
              selectedDiv == "reports"
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
            <p className="p-2 font-bold">Interview Reports</p>
          </div>
          <div
            className={`bg-neutral-800 border-b border-l border-r ${
              selectedDiv == "reports"
                ? "border-neutral-500"
                : "border-neutral-700"
            } h-[82vh] flex justify-center overflow-y-auto`}
            style={{
              borderTopLeftRadius: "0",
              borderTopRightRadius: "0",
              borderBottomRightRadius: "10px",
              borderBottomLeftRadius: "10px",
            }}
          >
            <div className="flex-col p-4 w-full">
              {interviews.length === 0 ? (
                <p className="text-neutral-500 text-center">
                  You don't have any interview history. Press "Start Interview"
                  to try out your first mock interview.
                </p>
              ) : (
                interviews.map((interview, index) => (
                  <div className="flex items-center w-full py-3" key={index}>
                    <button
                      className="bg-neutral-700 w-full flex items-center justify-between"
                      style={{
                        color: "white",
                        borderRadius: "8px",
                        padding: "15px 12px",
                        border: "none",
                        fontSize: "16px",
                      }}
                      onClick={() => {
                        seeReport(
                          interview.id,
                          interview.questions,
                          interview.transcript
                        );
                      }}
                    >
                      <p className="text-left font-bold flex-grow">
                        Technical Interview
                      </p>
                      <p className="text-center w-1/3">
                        {formatDate(interview.date)}
                      </p>
                      <p
                        className={`text-right font-bold ${
                          interview.report.overallScore < 40
                            ? "text-red-500"
                            : interview.report.overallScore < 70
                            ? "text-orange-500"
                            : "text-green-500"
                        }`}
                      >
                        {interview.report.overallScore}
                      </p>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <div className="flex-col w-[25vw] ml-3 mr-5">
          <div
            className="flex-col"
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
              } h-[33vh] flex items-center justify-center`}
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
          <div
            className="flex-col"
            onMouseEnter={() => {
              setSelectedDiv("practice");
            }}
            onMouseLeave={() => {
              setSelectedDiv("");
            }}
          >
            <div
              className={`bg-neutral-700 border-t border-l border-r mt-3 ${
                selectedDiv == "practice"
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
              <p className="p-2 font-bold">More Practice</p>
            </div>
            <div
              className={`bg-neutral-800 border-b border-l border-r ${
                selectedDiv == "practice"
                  ? "border-neutral-500"
                  : "border-neutral-700"
              } h-[33vh] flex`}
              style={{
                borderTopLeftRadius: "0",
                borderTopRightRadius: "0",
                borderBottomRightRadius: "10px",
                borderBottomLeftRadius: "10px",
              }}
            >
              {interviews.length > 0 &&
                (() => {
                  // Find the interview with the lowest score
                  const lowestScoreInterview = interviews.reduce(
                    (lowest, current) => {
                      return current.report.overallScore <
                        lowest.report.overallScore
                        ? current
                        : lowest;
                    },
                    interviews[0]
                  );

                  return (
                    <div className="p-4 w-full">
                      <p className="font-bold text-lg">Trouble Questions:</p>
                      {lowestScoreInterview.questions.map((question, index) => (
                        <div key={index} className="flex items-center mb-3">
                          <a
                            href={question.metadata.url}
                            className="pr-3 block"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {question.metadata.title}
                          </a>
                          <div
                            className={`inline-block rounded-full font-bold bg-neutral-700 px-2 py-1 ${getDifficultyColor(
                              question.metadata.difficulty
                            )}`}
                          >
                            {question.metadata.difficulty}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
            </div>
          </div>
          <Button
            className="mt-3 w-full h-[8vh]"
            onClick={() => setOpenModal(true)}
          >
            Start Your Interview
          </Button>
        </div>
      </div>
      <Dialog
        open={openModal}
        onClose={(val) => setOpenModal(val)}
        static={true}
      >
        <DialogPanel>
          <h3 className="text-lg font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
            Let's Begin Your Technical Interview
          </h3>
          <p className="mt-2 leading-6 text-tremor-default text-tremor-content dark:text-dark-tremor-content">
            Please paste the job description of a role you are interested in
            below to generate the most appropriate questions, or describe the
            role your after in plain English.
          </p>
          <textarea
            value={jobDescription}
            onChange={(e) => {
              setJobDescription(e.target.value);
            }}
            className="border rounded-md p-2 h-[20vh] w-full mt-4 text-black"
          ></textarea>
          <Button
            className="mt-8 w-full"
            onClick={async () => {
              await getLeetcodeProblems();
            }}
          >
            Submit
          </Button>
        </DialogPanel>
      </Dialog>

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
