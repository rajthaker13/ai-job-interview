import React, { useState } from "react";
import pdfToText from "react-pdftotext";
import OpenAI from "openai";

export default function Resume() {
  const [pdfText, setPdfText] = useState("");
  const openai = new OpenAI({
    apiKey: "sk-proj-bDhKwBhyKB0Del1D2IiPT3BlbkFJCAoB10kc39MQMqI5pD2V",
    dangerouslyAllowBrowser: true,
  });
  const extractText = (event) => {
    const file = event.target.files[0];
    if (file) {
      pdfToText(file)
        .then(async (text) => {
          console.log("Extracted text:", text);

          const context = `
          You are an AI designed to parse and extract information from resumes. 
          Given the following resume text, extract the following details:
          - Name
          - Email
          - List of Universities attended
          - List of professional experiences
          - List of projects
          - List of programming languages
          - List of skills
          - List of certifications
            and return in a JSON template: "{
                "name": "",
                "email": "",
                "universities": [],
                "experiences": [
                    {
                    "company": "",
                    "role": "",
                    "duration": "",
                    "location": "",
                    "description": ""
                    }
                ],
                "projects": [
                    {
                    "title": "",
                    "description": ""
                    }
                ],
                "programming_languages": [],
                "skills": [],
                "certifications": []
                }
"
          Resume text: ${text}
        `;

          const response = await openai.chat.completions.create({
            model: "gpt-4o", // or your specific model if different
            messages: [
              { role: "system", content: context },
              {
                role: "user",
                content: text,
              },
            ],
          });

          //const gptResponse = response.data.choices[0].message.content;
          console.log(response);
          //setPdfText(gptResponse);
        })
        .catch((error) =>
          console.error("Failed to extract text from pdf", error)
        );
    } else {
      console.error("No file selected");
    }
  };

  return (
    <div>
      <form>
        <label htmlFor="pdfUpload">Upload PDF</label>
        <input
          type="file"
          id="pdfUpload"
          accept="application/pdf"
          onChange={extractText}
        />
      </form>
      {pdfText && (
        <div>
          <h3>Extracted Text:</h3>
          <pre>{pdfText}</pre>
        </div>
      )}
    </div>
  );
}
