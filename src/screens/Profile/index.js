import React, { useEffect, useState, useRef } from "react";
import { ProgressCircle, ProgressBar } from "@tremor/react";
import OpenAI from "openai";
import { useLocation, useNavigate } from "react-router-dom";

export default function Profile(props) {
  const openai = new OpenAI({
    apiKey: "sk-proj-bDhKwBhyKB0Del1D2IiPT3BlbkFJCAoB10kc39MQMqI5pD2V",
    dangerouslyAllowBrowser: true,
  });

  const navigate = useNavigate();

  const [selectedDiv, setSelectedDiv] = useState(null);
  const [radius, setRadius] = useState(calculateRadius());

  const [interviews, setInterviews] = useState([]);
  const [overallScore, setOverallScore] = useState(0);

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
        for (const interview of data[0].interviews) {
          overall += parseInt(interview.report.overallScore);
        }
        setOverallScore(Math.round(overall / data[0].interviews.length));
      }
    } catch (error) {}
  }

  useEffect(() => {
    getUserData();
  }, []);

  return (
    <div
      className="bg-[#05050D] text-white flex-col"
      style={{ height: "100vh", width: "100vw" }}
    >
      <p className="font-bold text-4xl pl-6 pt-6 pb-3">Profile</p>
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
            <p className="p-2 font-bold">Interview Reports</p>
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
              {interviews.map((interview, index) => (
                <div className="flex items-center w-full py-4" key={index}>
                  <button
                    className="bg-neutral-700"
                    style={{
                      color: "white",
                      borderRadius: "8px",
                      padding: "6px 12px",
                      border: "none",
                      fontSize: "13px",
                    }}
                    onClick={() => {
                      seeReport(
                        interview.id,
                        interview.questions,
                        interview.transcript
                      );
                    }}
                  >
                    <p className="flex-grow text-left font-bold">
                      {"Technical Interview on " + formatDate(interview.date)}
                    </p>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div
          className="flex-col w-[65vw] ml-3"
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
              {/*scoreDiscussion.map((msg, index) => (
                <p
                  key={index}
                  dangerouslySetInnerHTML={{
                    __html: msg.content,
                  }}
                  className={`py-1 whitespace-pre-wrap break-words ${
                    msg.type === "gpt" ? "text-blue-300" : "text-white-300"
                  }`}
                ></p>
              ))*/}
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
                /*if (event.key === "Enter") {
                  event.preventDefault();
                  let temp = event.target.value;
                  event.target.value = "";
                  setScoreDicussion((prevHistory) => [
                    ...prevHistory,
                    { type: "user", content: markdownToHTML(temp) },
                  ]);
                  await chatWithCoach(temp);
                }*/
              }}
              className="w-full h-[5vh] rounded-lg border border-neutral-700 bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Chat with your coach..."
              style={{ "--placeholder-color": "#a0aec0" }}
            />
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
