import React, { useEffect, useState, useRef } from "react";
import { ProgressCircle } from "@tremor/react";
import OpenAI from "openai";

import { useLocation, useNavigate } from "react-router-dom";

export default function Report(props) {
  const openai = new OpenAI({
    apiKey: "sk-proj-bDhKwBhyKB0Del1D2IiPT3BlbkFJCAoB10kc39MQMqI5pD2V",
    dangerouslyAllowBrowser: true,
  });

  const [radius, setRadius] = useState(calculateRadius());

  // Function to calculate radius based on viewport size
  function calculateRadius() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    // Adjust the radius calculation as needed
    const radius = Math.min(width, height) * 0.1; // Example: 10% of the smaller dimension
    return radius;
  }

  const navigate = useNavigate();
  const location = useLocation();
  const { conversationHistory, leetcodeMatches } = location.state || {};

  const [codeScore, setCodeScore] = useState(0);
  const [complexityScore, setComplexityScore] = useState(0);
  const [engagementScore, setEngagementScore] = useState(0);
  const [overallScore, setOverallScore] = useState(0);
  const [firstLoad, setFirstLoad] = useState(true);

  async function generateReport() {
    let conversationString = "";
    if (conversationHistory[0]) {
      conversationHistory.map((convo) => {
        conversationString += convo.type + ": " + convo.content + "\n";
      });
    }

    try {
      const context = `Your name is Katie. You are a tech interviewer for a large software company. You have just completed a technical interview with the student. 
      Here was the problem: 
      ${leetcodeMatches ? leetcodeMatches[0].metadata.title : ""} ${
        leetcodeMatches ? leetcodeMatches[0].metadata.description : ""
      }. 
      Consider the optimal solution to the problem. The optimal solution is the one that has the best time and space complexity.
      The student should have been talking through their solution, discussing ideas and potential implementations.
      Here is a transcript of the interview:
      ${conversationString}
      Consider the last version of code that the student submitted to you. You are to grade it using the test cases in the problem description as well as new test cases you come up with.
      Your task now is to generate a report for the student. This interview was just a practice mock interview, so you are to provide feedback that would most help the student in their interview preparation.
      Consider the process the student took to arrive at the answer. Consider whether their answers were correct or not. Consider how much the student engaged in dialogue with you and showed you their though process.
      If you are asked for numerical metrics or score, your response should be an integer, so that it can be easily parsed.
      If you are asked for a text-based answer, your response should be short, easily readable, and you should always address the student directly, for example: 
      "You need practice with dynamic programming style questions. I recommend you do more problems similar to the one you saw in the interview today."
      `;

      let codePrompt = [
        { role: "system", content: context },
        {
          role: "user",
          content:
            "Generate a score out of 100 only for the code aspect of the interview. Don't consider the applicant's level of engagement with the interviewer. Give higher scores for more optimal solutions, the more test cases the code passed, the higher the score. If the student did not participate in the interview or did not submit any code, return 0. Return only an integer, nothing else.",
        },
      ];

      const codeResponse = await openai.chat.completions.create({
        messages: codePrompt,
        model: "gpt-4",
      });

      setCodeScore(codeResponse.choices[0].message.content);

      let complexityPrompt = [
        { role: "system", content: context },
        {
          role: "user",
          content:
            "Generate a score out of 100 for the student's ability to answer questions about big-O time and space complexity. Don't consider the correctness of the applicant's code, only their demonstrated knowledge of big-O. If the student did not discuss big-O at all, return 0. Return only an integer, nothing else.",
        },
      ];

      const complexityResponse = await openai.chat.completions.create({
        messages: complexityPrompt,
        model: "gpt-4",
      });

      setComplexityScore(complexityResponse.choices[0].message.content);

      let engagementPrompt = [
        { role: "system", content: context },
        {
          role: "user",
          content:
            "Generate a score out of 100 for the student's engagement with the interviewer. Don't consider the correctness of the applicant's code, only how much they communicated their thinking process. Give higher scores if the applicant clearly walked the interviewer through their thinking, through each step and idea of their solution, and how well they took feedback and were willing to improve their code. If the student did not participate in the interview at all, return 0. Return only an integer, nothing else.",
        },
      ];

      const engagementResponse = await openai.chat.completions.create({
        messages: engagementPrompt,
        model: "gpt-4",
      });

      setEngagementScore(engagementResponse.choices[0].message.content);

      let overallPrompt = [
        { role: "system", content: context },
        {
          role: "user",
          content:
            "Generate an overall score out of 100 for the interview based on code correctness, code optimality, knowledge of big-O concepts, engagement with the interviewer, general problem solving skills, and pleasant attitude. If the student did not participate in the interview, return 0. Return only an integer, nothing else.",
        },
      ];

      const overallResponse = await openai.chat.completions.create({
        messages: overallPrompt,
        model: "gpt-4",
      });

      setOverallScore(overallResponse.choices[0].message.content);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    if (firstLoad) {
      setFirstLoad(false);
      generateReport();
    }

    const handleResize = () => {
      setRadius(calculateRadius());
    };

    // Set the initial radius
    setRadius(calculateRadius());

    // Add resize event listener
    window.addEventListener("resize", handleResize);

    console.log("Code: ", codeScore);
    console.log("big-O: ", complexityScore);
    console.log("engagement: ", engagementScore);
    console.log("overall: ", overallScore);
  });

  return (
    <div
      className="bg-neutral-900 text-white flex-col"
      style={{ height: "100vh", width: "100vw" }}
    >
      <p className="font-bold text-4xl pl-6 pt-5 pb-5">Your Interview Report</p>
      <div className="flex justify-center">
        <div className="flex-col w-[25vw] mx-5">
          <div
            className="bg-neutral-700 border border-neutral-700 h-[5vh]"
            style={{
              borderTopLeftRadius: "10px",
              borderTopRightRadius: "10px",
              borderBottomRightRadius: "0",
              borderBottomLeftRadius: "0",
            }}
          >
            <p className="p-2 font-bold">Code</p>
          </div>
          <div
            className="bg-neutral-800 border border-neutral-700 h-[30vh] flex items-center justify-center"
            style={{
              borderTopLeftRadius: "0",
              borderTopRightRadius: "0",
              borderBottomRightRadius: "10px",
              borderBottomLeftRadius: "10px",
            }}
          >
            <ProgressCircle
              value={codeScore}
              color={"emerald"}
              radius={radius}
              strokeWidth={6}
            >
              <span className="text-white text-3xl font-bold">{codeScore}</span>
            </ProgressCircle>
          </div>
        </div>
        <div className="flex-col w-[25vw] mx-5">
          <div
            className="bg-neutral-700 border border-neutral-700 h-[5vh]"
            style={{
              borderTopLeftRadius: "10px",
              borderTopRightRadius: "10px",
              borderBottomRightRadius: "0",
              borderBottomLeftRadius: "0",
            }}
          >
            <p className="p-2 font-bold">Big-O</p>
          </div>
          <div
            className="bg-neutral-800 border border-neutral-700 h-[30vh] flex items-center justify-center"
            style={{
              borderTopLeftRadius: "0",
              borderTopRightRadius: "0",
              borderBottomRightRadius: "10px",
              borderBottomLeftRadius: "10px",
            }}
          >
            <ProgressCircle
              value={complexityScore}
              color={"amber"}
              radius={radius}
              strokeWidth={6}
            >
              <span className="text-white text-3xl font-bold">
                {complexityScore}
              </span>
            </ProgressCircle>
          </div>
        </div>
        <div className="flex-col w-[25vw] mx-5">
          <div
            className="bg-neutral-700 border border-neutral-700 h-[5vh]"
            style={{
              borderTopLeftRadius: "10px",
              borderTopRightRadius: "10px",
              borderBottomRightRadius: "0",
              borderBottomLeftRadius: "0",
            }}
          >
            <p className="p-2 font-bold">Engagement</p>
          </div>
          <div
            className="bg-neutral-800 border border-neutral-700 h-[30vh] flex items-center justify-center"
            style={{
              borderTopLeftRadius: "0",
              borderTopRightRadius: "0",
              borderBottomRightRadius: "10px",
              borderBottomLeftRadius: "10px",
            }}
          >
            <ProgressCircle
              value={engagementScore}
              color={"cyan"}
              radius={radius}
              strokeWidth={6}
            >
              <span className="text-white text-3xl font-bold">
                {engagementScore}
              </span>
            </ProgressCircle>
          </div>
        </div>
        <div className="flex-col w-[25vw] mx-5">
          <div
            className="bg-neutral-700 border border-neutral-700 h-[5vh]"
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
            className="bg-neutral-800 border border-neutral-700 h-[30vh] flex items-center justify-center"
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
    </div>
  );
}
