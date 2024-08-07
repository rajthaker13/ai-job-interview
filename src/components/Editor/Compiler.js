import React, { useEffect, useState } from "react";
import CodeEditorWindow from "./CodeEditorWindow";
import axios from "axios";
import { classnames } from "./utils/general";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { defineTheme } from "./lib/defineTheme";
import useKeyPress from "./constants/statuses";
import OutputDetails from "./OutputDetails";
import ThemeDropdown from "./ThemeDropdown";
import LanguagesDropdown from "./LanguagesDropdown";

const Compiler = ({
  editorHeight,
  editorWidth,
  code,
  setCode,
  language,
  setLanguage,
  outputDetails,
  setOutputDetails,
  questionIndex,
  setQuestionIndex,
  endInterview,
}) => {
  //TODO: Edit JavascriptDefault to reflect cur problem, also need to have code for other languages on language change...
  const [processing, setProcessing] = useState(null);
  const [theme, setTheme] = useState("cobalt");

  const enterPress = useKeyPress("Enter");
  const ctrlPress = useKeyPress("Control");

  const onSelectChange = (sl) => {
    console.log("selected Option...", sl);
    setLanguage(sl);
  };

  useEffect(() => {
    if (enterPress && ctrlPress) {
      console.log("enterPress", enterPress);
      console.log("ctrlPress", ctrlPress);
      handleCompile();
    }
  }, [ctrlPress, enterPress]);

  const onChange = (action, data) => {
    switch (action) {
      case "code": {
        setCode(data);
        break;
      }
      default: {
        console.warn("case not handled!", action, data);
      }
    }
  };

  const handleCompile = () => {
    setProcessing(true);
    const formData = {
      language_id: language.id,
      // encode source code in base64
      source_code: btoa(code),
    };
    const options = {
      method: "POST",
      url: process.env.REACT_APP_RAPID_API_URL,
      params: { base64_encoded: "true", fields: "*" },
      headers: {
        "content-type": "application/json",
        "Content-Type": "application/json",
        "X-RapidAPI-Host": process.env.REACT_APP_RAPID_API_HOST,
        "X-RapidAPI-Key": process.env.REACT_APP_RAPID_API_KEY,
      },
      data: formData,
    };

    axios
      .request(options)
      .then(function (response) {
        console.log("res.data", response.data);
        const token = response.data.token;
        checkStatus(token);
      })
      .catch((err) => {
        let error = err.response ? err.response.data : err;
        // get error status
        let status = err.response.status;
        console.log("status", status);
        if (status === 429) {
          console.log("too many requests", status);

          showErrorToast(
            `Quota of 100 requests exceeded for the Day! Please read the blog on freeCodeCamp to learn how to setup your own RAPID API Judge0!`,
            10000
          );
        }
        setProcessing(false);
        console.log("catch block...", error);
      });
  };

  const checkStatus = async (token) => {
    const options = {
      method: "GET",
      url: process.env.REACT_APP_RAPID_API_URL + "/" + token,
      params: { base64_encoded: "true", fields: "*" },
      headers: {
        "X-RapidAPI-Host": process.env.REACT_APP_RAPID_API_HOST,
        "X-RapidAPI-Key": process.env.REACT_APP_RAPID_API_KEY,
      },
    };
    try {
      let response = await axios.request(options);
      let statusId = response.data.status?.id;

      // Processed - we have a result
      if (statusId === 1 || statusId === 2) {
        // still processing
        setTimeout(() => {
          checkStatus(token);
        }, 2000);
        return;
      } else {
        setProcessing(false);
        setOutputDetails(response.data);
        showSuccessToast(`Compiled Successfully!`);
        console.log("response.data", response.data);
        return;
      }
    } catch (err) {
      console.log("err", err);
      setProcessing(false);
      showErrorToast();
    }
  };

  function handleThemeChange(th) {
    const theme = th;
    console.log("theme...", theme);

    if (["light", "vs-dark"].includes(theme.value)) {
      setTheme(theme);
    } else {
      defineTheme(theme.value).then((_) => setTheme(theme));
    }
  }
  useEffect(() => {
    defineTheme("oceanic-next").then((_) =>
      setTheme({ value: "oceanic-next", label: "Oceanic Next" })
    );
  }, []);

  const showSuccessToast = (msg) => {
    toast.success(msg || `Compiled Successfully!`, {
      position: "top-right",
      autoClose: 1000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  const showErrorToast = (msg, timer) => {
    toast.error(msg || `Something went wrong! Please try again.`, {
      position: "top-right",
      autoClose: timer ? timer : 1000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  return (
    <div className="rounded-lg bg-neutral-800 flex flex-col h-[95%] overflow-y-auto">
      <div className="flex flex-row space-x-20 px-4 py-4">
        <div className="flex flex-col flex-grow min-w-0">
          <div className="flex flex-row mb-4">
            <LanguagesDropdown onSelectChange={onSelectChange} />
            <div className="pl-4">
              <ThemeDropdown
                handleThemeChange={handleThemeChange}
                theme={theme}
              />
            </div>
            <button
              onClick={handleCompile}
              disabled={!code}
              className={classnames(
                "z-10 rounded-md ml-3 px-4 py-2 text-sm bg-neutral-800 hover:bg-neutral-700 flex-shrink-0",
                !code ? "opacity-50" : ""
              )}
            >
              {processing ? "Processing..." : "Compile and Execute"}
            </button>
            <button
              className={`${
                questionIndex < 2
                  ? "z-10 rounded-md ml-3 px-4 py-2 text-sm bg-neutral-800 hover:bg-neutral-700 flex-shrink-0"
                  : ""
              }`}
              style={
                questionIndex == 2
                  ? {
                      backgroundColor: "#FF4D4D",
                      color: "white",
                      borderRadius: "8px",
                      padding: "6px 12px",
                      border: "none",
                      fontSize: "13px",
                      marginLeft: "15px",
                    }
                  : {}
              }
              onClick={() => {
                if (questionIndex == 2) {
                  endInterview();
                } else {
                  setQuestionIndex(questionIndex + 1);
                }
              }}
            >
              {questionIndex < 2 ? "Next Question" : "End Interview"}
            </button>
          </div>

          <div className="flex flex-row">
            <CodeEditorWindow
              code={code}
              onChange={onChange}
              language={language?.value}
              theme={theme.value}
              height={editorHeight}
              width={editorWidth}
            />
            <div className="flex flex-col items-end text-right">
              {outputDetails && <OutputDetails outputDetails={outputDetails} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Compiler;
