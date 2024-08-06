import "./App.css";
import { createClient } from "@supabase/supabase-js";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./screens/Login";
import Home from "./screens/Home";
import Interview from "./screens/Interview";
import Report from "./screens/Report";
import Header from "./components/Header";

function App() {
  const supabaseUrl = "https://twqwiryumiolecfebqtd.supabase.co";
  const supabaseKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3cXdpcnl1bWlvbGVjZmVicXRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjE2MjkxMjYsImV4cCI6MjAzNzIwNTEyNn0.tNUDnNbMM96MFrQNf9lOOi3gWLFl2cSfCToa0_tjd8M";
  const supabase = createClient(supabaseUrl, supabaseKey);

  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Login db={supabase} isNewAccount={true} />} />
        <Route
          path="/login"
          element={<Login db={supabase} isNewAccount={false} />}
        />
        <Route path="/home" element={<Home db={supabase} />} />
        <Route path="/interview" element={<Interview db={supabase} />} />
        <Route path="/report" element={<Report db={supabase} />} />
      </Routes>
    </Router>
  );
}

export default App;
