import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import {
  Upload,
  FileText,
  CheckCircle,
  Loader,
  MessageSquare,
  Send,
  LogOut,
  BookOpen,
} from "lucide-react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

// Source Reference Card Component
const SourceCards = ({ sources }) => {
  if (!sources || sources.length === 0) return null;
  return (
    <div className="mt-3 pt-3 border-t border-white/10">
      <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
        <BookOpen size={12} />
        Sources
      </p>
      <div className="flex flex-wrap gap-2">
        {sources.map((source) => (
          <div
            key={source.id}
            className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-1.5 text-xs"
          >
            <FileText size={12} className="text-blue-400 shrink-0" />
            <div>
              <span className="text-blue-300 font-semibold">
                Source {source.id}
              </span>
              <span className="text-gray-400 mx-1">·</span>
              <span className="text-gray-300 truncate max-w-[120px] inline-block align-bottom">
                {source.filename}
              </span>
              <span className="text-gray-400 mx-1">·</span>
              <span className="text-purple-300">Page {source.page}</span>
              <span className="text-gray-400 mx-1">·</span>
              <span className="text-green-400">{source.score}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [query, setQuery] = useState("");
  const [chatHistory, setChatHistory] = useState([
    {
      role: "system",
      content:
        "Hello! Upload a PDF to get started, or ask me anything about your uploaded documents.",
    },
  ]);
  const [loading, setLoading] = useState(false);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/auth");
  }, [navigate]);

  // Fetch Chat History on Mount
  useEffect(() => {
    const fetchHistory = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/auth");
        return;
      }

      try {
        const res = await axios.get(
          "${import.meta.env.VITE_API_URL}/api/chat/history",
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (res.data && res.data.length > 0) {
          setChatHistory((prev) => [...prev.slice(0, 1), ...res.data]);
        }
      } catch (err) {
        console.error("Failed to load history:", err);
        if (err.response && err.response.status === 401) {
          handleLogout();
        }
      }
    };

    fetchHistory();
  }, [navigate, handleLogout]);

  // Auto-scroll effect
  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    const token = localStorage.getItem("token");
    setUploading(true);
    setUploadStatus("Uploading & Processing...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(
        "${import.meta.env.VITE_API_URL}/api/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setUploadStatus(`Success! Processed ${res.data.totalChunks} chunks.`);
    } catch (error) {
      console.error("Upload Error:", error);
      const msg =
        error.response?.data?.message || error.message || "Upload Failed";
      setUploadStatus(`❌ Error: ${msg}`);
      alert(`Upload Failed: ${msg}`);
    } finally {
      setUploading(false);
    }
  };

  const handleQuery = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    const token = localStorage.getItem("token");
    const newHistory = [...chatHistory, { role: "user", content: query }];
    setChatHistory(newHistory);
    setQuery("");
    setLoading(true);

    try {
      const res = await axios.post(
        "${import.meta.env.VITE_API_URL}/api/chat",
        { query },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const rawData = res.data;
      const lines = rawData.split("\n\n");
      let accumulatedText = "";
      let sources = [];

      lines.forEach((line) => {
        if (line.startsWith("data: ")) {
          const jsonStr = line.replace("data: ", "");
          if (jsonStr === "[DONE]") return;
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.type === "sources") {
              sources = parsed.sources;
            } else if (parsed.text) {
              accumulatedText += parsed.text;
            }
            // eslint-disable-next-line no-empty
          } catch {}
        }
      });

      if (!accumulatedText) accumulatedText = rawData;

      setChatHistory((prev) => [
        ...prev,
        { role: "bot", content: accumulatedText, sources: sources },
      ]);
    } catch (error) {
      console.error("Chat Error:", error);
      setChatHistory((prev) => [
        ...prev,
        { role: "bot", content: "Sorry, I encountered an error." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full relative z-10 p-6 gap-6">
      {/* HEADER BAR */}
      <header className="flex items-center justify-between w-full bg-white/5 border border-white/10 rounded-2xl p-4 px-6 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.3)]">
            <MessageSquare className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              OpsMind AI
            </h1>
            <p className="text-xs text-gray-400 font-medium">
              Enterprise SOP Intelligence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="h-8 w-[1px] bg-white/10"></div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-lg transition-all border border-red-500/20 hover:border-red-500/40 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]"
          >
            <LogOut size={18} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Left Panel: Upload */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-1/3 glass-panel rounded-2xl p-6 flex flex-col gap-6"
        >
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Upload size={20} className="text-blue-400" />
            Upload SOPs
          </h2>

          <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 flex flex-col items-center justify-center gap-4 hover:border-blue-500 transition-colors bg-black/20 group">
            <div className="p-4 rounded-full bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
              <FileText size={40} className="text-blue-400" />
            </div>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf"
              className="hidden"
              id="file-upload"
            />

            <div className="text-center">
              <p className="text-gray-300 font-medium mb-1">
                Drag & Drop your PDF
              </p>
              <p className="text-gray-500 text-xs mb-4">
                or click below to browse
              </p>

              <label
                htmlFor="file-upload"
                className="cursor-pointer bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg border border-white/20 transition-all font-medium inline-flex items-center gap-2 hover:border-blue-500/50"
              >
                <Upload size={16} />
                Select PDF File
              </label>
            </div>
          </div>

          {file && (
            <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl">
              <FileText size={20} className="text-blue-400" />
              <span className="truncate text-sm font-medium text-blue-100">
                {file.name}
              </span>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="mt-auto w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
          >
            {uploading ? (
              <Loader className="animate-spin" />
            ) : (
              <CheckCircle size={20} />
            )}
            {uploading ? "Ingesting Document..." : "Process Document"}
          </button>

          {uploadStatus && (
            <p
              className={`text-center text-xs font-bold uppercase tracking-wide ${uploadStatus.includes("Success") ? "text-green-400" : "text-red-400"}`}
            >
              {uploadStatus}
            </p>
          )}
        </motion.div>

        {/* Right Panel: Chat */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-2/3 glass-panel rounded-2xl p-6 flex flex-col"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <MessageSquare className="text-purple-400" size={20} />
              AI Assistant
            </h2>
            <span className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">
              Llama
            </span>
          </div>

          <div className="flex-1 overflow-y-auto mb-6 space-y-6 pr-2 custom-scrollbar">
            {chatHistory.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-none shadow-blue-900/20"
                      : "bg-gray-800/50 text-gray-200 rounded-bl-none border border-white/10"
                  }`}
                >
                  {msg.role === "bot" ? (
                    <div>
                      <div className="markdown-content text-[15px] leading-7">
                        <ReactMarkdown
                          components={{
                            h3: ({ children }) => (
                              <strong className="text-blue-300 block mb-2">
                                {children}
                              </strong>
                            ),
                            h2: ({ children }) => (
                              <strong className="text-blue-300 block mb-2">
                                {children}
                              </strong>
                            ),
                            h1: ({ children }) => (
                              <strong className="text-blue-300 block mb-2">
                                {children}
                              </strong>
                            ),
                            p: ({ children }) => (
                              <p className="mb-3 last:mb-0">{children}</p>
                            ),
                            strong: ({ children }) => (
                              <strong className="text-blue-300 font-semibold">
                                {children}
                              </strong>
                            ),
                            code: ({ children }) => (
                              <code className="bg-black/30 px-1.5 py-0.5 rounded text-sm text-blue-300">
                                {children}
                              </code>
                            ),
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                      {/* Source Reference Cards */}
                      <SourceCards sources={msg.sources} />
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-[15px] leading-7">
                      {msg.content}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-800/50 p-4 rounded-2xl rounded-bl-none flex gap-2 items-center border border-white/5">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-75" />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-150" />
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleQuery} className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question about the SOPs..."
              className="w-full bg-black/20 border border-white/10 rounded-xl py-4 px-6 pr-14 focus:outline-none focus:border-blue-500/50 focus:bg-black/40 text-white placeholder-gray-500 transition-all shadow-inner"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="absolute right-2 top-2 p-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              <Send size={20} />
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
