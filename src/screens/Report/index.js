import React, { useEffect, useState, useRef } from "react";
import { ProgressCircle, ProgressBar } from "@tremor/react";
import OpenAI from "openai";

import { useLocation, useNavigate } from "react-router-dom";

export default function Report(props) {
  const openai = new OpenAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY,
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
  const [shouldGenerate, setShouldGenerate] = useState(false);

  const [shouldUpload, setShouldUpload] = useState(false);
  const [interviewIdx, setInterviewIdx] = useState(-1);

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
      const context = `You are a technical interview performance analyzer. Analyze the candidate's coding performance based on:
      1. Code correctness (test cases passed)
      2. Solution efficiency (compared to optimal solution)
      3. Time taken to reach solution
      4. Code quality and readability

      Here were the problems: 
      ${leetcodeMatches
          ? leetcodeMatches.map((question) => {
            return question.metadata.title + ": " + question.metadata.description;
          })
          : ""}

      Here is the interview transcript with timestamps. Code submissions are labeled "code", successful outputs are labeled "output", and errors are labeled "error":
      ${conversationString}`;

      let technicalPrompt = [
        { role: "system", content: context },
        {
          role: "user",
          content:
            "Generate exactly 4 technical scoring categories based on code performance metrics. Return ONLY a JSON array in this exact format, with no additional text: [{\"name\": \"Solution Correctness\", \"score\": 85}, {\"name\": \"Code Efficiency\", \"score\": 80}, {\"name\": \"Implementation Speed\", \"score\": 75}, {\"name\": \"Code Quality\", \"score\": 90}]. Use appropriate scores based on the interview performance.",
        },
      ];

      const technicalResponse = await openai.chat.completions.create({
        messages: technicalPrompt,
        model: "gpt-4o-mini",
      });

      try {
        const parsedScores = JSON.parse(technicalResponse.choices[0].message.content.trim());
        setTechnicalScores(parsedScores);
      } catch (parseError) {
        console.error("Failed to parse technical scores:", parseError);
        // Fallback default scores
        setTechnicalScores([
          { name: "Solution Correctness", score: 0 },
          { name: "Code Efficiency", score: 0 },
          { name: "Implementation Speed", score: 0 },
          { name: "Code Quality", score: 0 },
        ]);
      }

      let overallPrompt = [
        { role: "system", content: context },
        {
          role: "user",
          content:
            "Based on the technical performance metrics, return ONLY a number between 0 and 100 representing the overall score. Return just the number, nothing else.",
        },
      ];

      const overallResponse = await openai.chat.completions.create({
        messages: overallPrompt,
        model: "gpt-4o-mini",
      });

      setOverallScore(parseInt(overallResponse.choices[0].message.content.trim(), 10) || 0);

      let discussionPrompt = [
        { role: "system", content: context },
        {
          role: "user",
          content: `Analyze the technical performance and return exactly 4 bullet points in this format:
          • **Test Cases:** [Analysis of test case performance]
          • **Solution Efficiency:** [Comparison to optimal solution]
          • **Areas to Improve:** [Technical areas for improvement]
          • **Technical Strengths:** [Best technical aspects shown]`,
        },
      ];

      const discussionResponse = await openai.chat.completions.create({
        messages: discussionPrompt,
        model: "gpt-4o-mini",
      });

      setScoreDicussion([
        {
          type: "gpt",
          content: markdownToHTML(discussionResponse.choices[0].message.content),
        },
      ]);

      setShouldUpload(true);
    } catch (error) {
      console.error("Error generating report:", error);
    }
  }

  async function uploadReport() {
    const { data: { user } } = await props.db.auth.getUser()
    const uid = user.id
    let conversationString = "";
    if (conversationHistory[0]) {
      conversationHistory.map((convo) => {
        conversationString += convo.type + ": " + convo.content + "\n";
      });
    }

    setShouldGenerate(false);

    const { data, error } = await props.db
      .from("users")
      .select()
      .eq("uid", uid);

    let newInterview = {
      date: new Date(),
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

  async function pullReport(interviewIdx) {
    const { data: { user } } = await props.db.auth.getUser()
    const uid = user.id

    const { data, error } = await props.db
      .from("users")
      .select()
      .eq("uid", uid);

    if (data && data[0]) {
      let report = data[0].interviews[interviewIdx].report;
      setOverallScore(parseInt(report.overallScore, 10));
      setVerbalScores(report.verbalScores);
      setTechnicalScores(report.technicalScores);
      setScoreDicussion(report.scoreDiscussion);
    }
  }

  async function isNewReport() {
    const { data: { user } } = await props.db.auth.getUser()
    const uid = user.id

    const { data, error } = await props.db
      .from("users")
      .select()
      .eq("uid", uid);

    if (data && data[0]) {
      const index = data[0].interviews.findIndex(
        (interview) => interview.id === interviewID
      );

      if (index == -1) {
        setShouldGenerate(true);
        setInterviewIdx(-1);
      } else {
        setShouldGenerate(false);
        setInterviewIdx(index);
      }
    } else {
      setShouldGenerate(false);
      setInterviewIdx(-2);
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
    isNewReport();
  }, []);

  useEffect(() => {
    if (
      verbalScores.length == 0 &&
      technicalScores.length == 0 &&
      overallScore == 0 &&
      scoreDiscussion.length == 0
    ) {
      if (interviewIdx >= 0) {
        pullReport(interviewIdx);
      } else if (shouldGenerate) {
        setShouldGenerate(false);
        generateReport();
      }
    }

    if (
      // verbalScores.length != 0 &&
      technicalScores.length != 0 &&
      overallScore != 0 &&
      scoreDiscussion.length != 0 &&
      shouldUpload
    ) {
      setShouldUpload(false);
      setShouldGenerate(false);
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
    <div className="bg-[#05050D] min-h-screen pt-16 h-screen overflow-hidden">
      <div className="h-[calc(100vh-64px)] flex flex-col px-8 pb-8">
        {/* Header Section */}
        <div className="py-4 flex justify-between items-center flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-white">Interview Report</h1>
            <p className="text-gray-400">Review your performance and get personalized feedback</p>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Finish Interview
          </button>
        </div>

        {/* Main Content - Added overflow handling */}
        <div className="grid grid-cols-[2fr_1fr] gap-6 flex-1 overflow-hidden">
          {/* Left Column - Scores with scroll */}
          <div className="space-y-6 overflow-y-auto pr-2">
            {/* Overall Score Card */}
            <div className="bg-[#0D0D1A] rounded-xl border border-gray-800 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Overall Performance</h2>
              <div className="flex items-center justify-center">
                <ProgressCircle value={overallScore} size="xl" color="blue">
                  <span className="text-3xl font-bold text-white">{overallScore}%</span>
                </ProgressCircle>
              </div>
            </div>

            {/* Technical Scores */}
            <div className="bg-[#0D0D1A] rounded-xl border border-gray-800 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Technical Skills</h2>
              <div className="space-y-4">
                {technicalScores.map((score, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">{score.name}</span>
                      <span className="text-white">{score.score}%</span>
                    </div>
                    <ProgressBar value={score.score} color="blue" />
                  </div>
                ))}
              </div>
            </div>

            {/* Verbal Scores */}
            <div className="bg-[#0D0D1A] rounded-xl border border-gray-800 p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Communication Skills</h2>
              <div className="space-y-4">
                {verbalScores.map((score, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">{score.name}</span>
                      <span className="text-white">{score.score}%</span>
                    </div>
                    <ProgressBar value={score.score} color="purple" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Discussion with scroll */}
          <div className="bg-[#0D0D1A] rounded-xl border border-gray-800 flex flex-col h-full">
            <div className="p-4 border-b border-gray-800 flex-shrink-0">
              <h2 className="text-xl font-semibold text-white">Interview Feedback</h2>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                {scoreDiscussion.map((discussion, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg ${discussion.type === "gpt"
                      ? "bg-blue-500/10 border border-blue-500/20"
                      : "bg-purple-500/10 border border-purple-500/20"
                      }`}
                  >
                    <p
                      dangerouslySetInnerHTML={{ __html: discussion.content }}
                      className="text-gray-300 whitespace-pre-wrap"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
