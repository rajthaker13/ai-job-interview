import React, { useEffect, useState } from "react";

import Editor from "@monaco-editor/react";

const CodeEditorWindow = ({
  onChange,
  language,
  code,
  theme,
  height,
  width,
}) => {
  const [value, setValue] = useState(code || "");

  useEffect(() => {
    setValue(code);
  }, [code]);

  const handleEditorChange = (newValue) => {
    setValue(newValue);
    onChange("code", newValue);
  };

  return (
    <div className="overlay rounded-md overflow-hidden">
      <Editor
        height={`${height}vh`}
        width={`${width}vw`}
        language={language || "javascript"}
        value={value}
        theme={theme}
        defaultValue="// some comment"
        onChange={handleEditorChange}
      />
    </div>
  );
};
export default CodeEditorWindow;
