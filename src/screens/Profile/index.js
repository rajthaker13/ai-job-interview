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
    const { data: { user } } = await props.db.auth.getUser()
    console.log("user", user)
    const uid = user.id


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
      else {
        await props.db.from("users").insert({
          uid: uid,
        });

      }
    } catch (error) { }
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

    const handleResize = () => {
      setRadius(calculateRadius());
    };

    // Set the initial radius
    setRadius(calculateRadius());

    // Add resize event listener
    window.addEventListener("resize", handleResize);
  }, []);



  return (
    <div className="bg-[#05050D] min-h-screen pt-16 pl-64">
      <div className="h-[calc(100vh-64px)] flex flex-col px-8">
        {/* Welcome Section with Start Interview Button */}
        <div className="py-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Welcome back!</h1>
            <p className="text-gray-400">Track your interview progress and get personalized coaching</p>
          </div>
          <button
            onClick={() => setOpenModal(true)}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Start New Interview
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 grid grid-rows-[auto_1fr] gap-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-xl p-4 border border-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Total Interviews</h2>
                <span className="text-2xl font-bold text-purple-400">{interviews.length}</span>
              </div>
              <div className="mt-2 h-2 bg-gray-700 rounded-full">
                <div
                  className="h-2 bg-purple-500 rounded-full"
                  style={{ width: `${(interviews.length / 10) * 100}%` }}
                />
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl p-4 border border-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Average Score</h2>
                <span className="text-2xl font-bold text-blue-400">{overallScore || 0}</span>
              </div>
              <div className="mt-2 h-2 bg-gray-700 rounded-full">
                <div
                  className="h-2 bg-blue-500 rounded-full"
                  style={{ width: `${overallScore}%` }}
                />
              </div>
            </div>

            <div className="bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 rounded-xl p-4 border border-gray-800">
              <div className="flex flex-col items-center justify-center">
                <h2 className="text-lg font-semibold text-white mb-2">Overall Progress</h2>
                <ProgressCircle value={overallScore} color="cyan" radius={40} strokeWidth={8}>
                  <span className="text-2xl font-bold text-white">{overallScore || 'N/A'}</span>
                </ProgressCircle>
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Coach's Report */}
            <div className="bg-[#0D0D1A] rounded-xl border border-gray-800 flex flex-col">
              <div className="p-4 border-b border-gray-800">
                <h2 className="text-xl font-semibold text-white">Coach's Report</h2>
              </div>
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                  {scoreDiscussion.map((msg, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg ${msg.type === "gpt"
                        ? "bg-blue-500/10 border border-blue-500/20"
                        : "bg-purple-500/10 border border-purple-500/20"
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
              <div className="p-4 border-t border-gray-800">
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
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  placeholder="Ask your coach anything..."
                />
              </div>
            </div>

            {/* Interview Reports */}
            <div className="bg-[#0D0D1A] rounded-xl border border-gray-800 flex flex-col">
              <div className="p-4 border-b border-gray-800">
                <h2 className="text-xl font-semibold text-white">Interview Reports</h2>
              </div>
              <div className="flex-1 p-4 overflow-y-auto">
                {interviews.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="bg-blue-500/10 p-6 rounded-full mb-4">
                      <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <p className="text-gray-400">No interview history yet</p>
                    <p className="text-gray-500 text-sm mt-2">Start your first mock interview to begin tracking your progress</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {interviews.map((interview, index) => (
                      <button
                        key={index}
                        onClick={() => seeReport(interview.id, interview.questions, interview.transcript)}
                        className="w-full p-4 bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg hover:from-gray-800 hover:to-gray-700 transition-all duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-semibold">Technical Interview</p>
                            <p className="text-gray-400 text-sm">{formatDate(interview.date)}</p>
                          </div>
                          <div className={`px-4 py-2 rounded-full ${interview.report.overallScore < 40 ? "bg-red-500/20 text-red-400" :
                            interview.report.overallScore < 70 ? "bg-yellow-500/20 text-yellow-400" :
                              "bg-green-500/20 text-green-400"
                            }`}>
                            {interview.report.overallScore}%
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Dialog open={openModal} onClose={(val) => setOpenModal(val)} static={true}>
        <DialogPanel className="bg-[#0D0D1A] border border-gray-800 p-6 rounded-xl">
          <h3 className="text-xl font-semibold text-white mb-4">Start Your Technical Interview</h3>
          <p className="text-gray-400 mb-4">
            Paste a job description or describe the role you're interested in to generate relevant interview questions.
          </p>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="w-full h-32 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 mb-4"
            placeholder="Enter job description..."
          />
          <div className="flex justify-end">
            <button
              onClick={async () => await getLeetcodeProblems()}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
            >
              Generate Questions
            </button>
          </div>
        </DialogPanel>
      </Dialog>
    </div>
  );
}
