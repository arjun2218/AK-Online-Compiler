import React, { useState } from 'react';
import Editor from "@monaco-editor/react";
import axios from 'axios';

const languageMap = {
  python: 71,
  cpp: 54,
  c: 50,
  java: 62,
  javascript: 63,
  html: null,
  css: null
};

const defaultCode = {
  python: "print('Hello, World!')",
  cpp: `#include <bits/stdc++.h>
using namespace std;
int main() {
  cout << "Hello, World!";
  return 0;
}`,
  c: `#include <stdio.h>
int main() {
  printf("Hello, World!\\n");
  return 0;
}`,
  java: `import java.util.Scanner;
public class Main {
  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in); 
    System.out.println("Hello, World!");
  }
}`,
  javascript: `console.log("Hello, World!");`,
  html: `<!DOCTYPE html>
<html>
<head><title>Hello</title></head>
<body>Hello, World!</body>
</html>`,
  css: `body {
  font-family: Arial;
  background-color: #f0f0f0;
}`
};


function App() {
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(defaultCode["python"]);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [theme, setTheme] = useState("light");
  const [fileName, setFileName] = useState("");

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setLanguage(lang);
    setCode(defaultCode[lang]);
    setInput("");
    setOutput("");
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  const runCode = async () => {
    const langId = languageMap[language];
    if (!langId) {
      setOutput("Output not available for HTML/CSS.");
      return;
    }

    try {
      const res = await axios.post(
        "https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=false",
        {
          source_code: code,
          language_id: langId,
          stdin: input,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-RapidAPI-Key": "cb722b6566mshe3b7b98ba3a34fdp11e873jsnb0c09249412e",
            "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
          },
        }
      );

      const token = res.data.token;

      const pollResult = async () => {
        const result = await axios.get(
          `https://judge0-ce.p.rapidapi.com/submissions/${token}?base64_encoded=false`,
          {
            headers: {
              "X-RapidAPI-Key": "cb722b6566mshe3b7b98ba3a34fdp11e873jsnb0c09249412e",
              "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
            },
          }
        );
        if (result.data.status.id <= 2) {
          setTimeout(pollResult, 1000);
        } else {
          setOutput(result.data.stdout || result.data.stderr || "No output");
        }
      };

      pollResult();
    } catch (err) {
      setOutput("Error: " + err.message);
    }
  };

  const saveToFile = () => {
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "code.txt";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const openFile = (e) => {
    const file = e.target.files[0];
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = function (event) {
      setCode(event.target.result);
    };
    reader.readAsText(file);
  };

  const styles = {
    container: {
      padding: "20px",
      backgroundColor: theme === "light" ? "#ffffff" : "#121212",
      color: theme === "light" ? "#000000" : "#ffffff",
      minHeight: "100vh",
    },
    button: {
      padding: "10px 20px",
      margin: "10px 10px 10px 0",
      cursor: "pointer",
      backgroundColor: "#007bff",
      color: "#fff",
      border: "none",
      borderRadius: "4px",
    },
    textarea: {
      width: "100%",
      height: "100px",
      backgroundColor: theme === "light" ? "#f9f9f9" : "#1e1e1e",
      color: theme === "light" ? "#000" : "#fff",
      border: "1px solid #ccc",
      borderRadius: "4px",
      padding: "10px",
      marginBottom: "20px",
      fontFamily: "monospace",
    },
    output: {
      whiteSpace: "pre-wrap",
      backgroundColor: theme === "light" ? "#eee" : "#1e1e1e",
      color: theme === "light" ? "#000" : "#fff",
      padding: "10px",
      borderRadius: "4px",
    },
  };

  return (
    <div style={styles.container}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>Multilanguage Code Editor</h2>
        <button style={styles.button} onClick={toggleTheme}>
          {theme === "light" ? "🌙 Dark" : "☀️ Light"} Mode
        </button>
      </div>

      <select value={language} onChange={handleLanguageChange} style={{ padding: "10px", fontSize: "16px" }}>
        {Object.keys(languageMap).map((lang) => (
          <option key={lang} value={lang}>{lang.toUpperCase()}</option>
        ))}
      </select>

      <Editor
        height="300px"
        language={language}
        theme={theme === "light" ? "light" : "vs-dark"}
        value={code}
        onChange={(value) => setCode(value)}
        options={{ fontSize: 14, minimap: { enabled: false }, fontFamily: "monospace" }}
      />

      {["python", "cpp", "c", "java", "javascript"].includes(language) && (
        <>
          <h3>Input (stdin)</h3>
          <textarea
            style={styles.textarea}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </>
      )}

      <div>
        <button style={styles.button} onClick={runCode}>▶ Run</button>
        <input
          type="text"
          placeholder="Enter filename"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          style={{ padding: "10px", marginRight: "10px" }}
        />
        <button style={styles.button} onClick={saveToFile}>💾 Save</button>
        <input type="file" onChange={openFile} style={{ marginLeft: "10px" }} />
      </div>

      <h3>Output</h3>
      <pre style={styles.output}>{output}</pre>
    </div>
  );
}

export default App;
