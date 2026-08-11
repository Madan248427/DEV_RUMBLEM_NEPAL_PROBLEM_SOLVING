import React, { useState, useRef, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Button, Card } from "antd";
import { MessageOutlined, CloseOutlined, SendOutlined } from "@ant-design/icons";
import "./Chatbot.css";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";


const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleChat = () => setIsOpen(!isOpen);

  const fetchJWTFromBackend = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/accounts/rasa-token/",
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        // User not logged in - thas fine, return null silently
        return null;
      }

      const data = await response.json();
      return data?.jwt_token || null;
    } catch {
      // Network error or user not logged in - return null silently
      return null;
    }
  };

  /* =============================
     SEND MESSAGE
     Uses plain fetch() for Rasa webhook
  ============================== */

  const sendMessage = async () => {
    const trimmed = input.trim();

    if (!trimmed) return;

    const userMessage = {
      sender: "user",
      text: trimmed,
    };

    // Convert frontend messages to clean chat history
    const currentHistory = messages.map((msg) => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.text,
    }));

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const jwtToken = await fetchJWTFromBackend();

      const response = await fetch(
        "http://127.0.0.1:8000/ch/chat/",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(jwtToken
              ? {
                Authorization: `Bearer ${jwtToken}`,
              }
              : {}),
          },
          body: JSON.stringify({
            message: userMessage.text,
            history: currentHistory,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Chat server error");
      }

      const data = await response.json();

      if (data?.reply) {
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: data.reply,
          },
        ]);
      }
    } catch (error) {
      console.error("CHAT ERROR:", error);

      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Server error. Try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  /* =============================
     HANDLE ENTER KEY TO SEND
     No <form> used - pure keyboard handling
  ============================== */
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      if (e.nativeEvent) {
        e.nativeEvent.stopImmediatePropagation();
      }
      if (!isLoading && input.trim()) {
        sendMessage();
      }
    }
  };

  /* =============================
     UI
  ============================== */
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <div style={{ flex: 1, overflow: "auto" }}>
        <Outlet />
      </div>

      {isOpen && (
        <Card
          id="chatbot-container"
          title={
            <span className="chatbot-title">
              {"Marvel Nexus"} <span className="chatbot-title-icon">{"📚"}</span>
            </span>
          }
          size="small"
          className="chatbot-card"
          bodyStyle={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            overflow: "auto",
            padding: "12px",
          }}
          extra={
            <CloseOutlined
              onClick={toggleChat}
              style={{ cursor: "pointer", color: "#fff" }}
            />
          }
        >
          {/* CHAT AREA */}
          <div className="chatbot-messages">
            {messages.length === 0 && (
              <div className="chatbot-welcome">
                {"Hi! How can I help you find books today?"}
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`chatbot-msg ${msg.sender === "user" ? "chatbot-msg-user" : "chatbot-msg-bot"}`}
              >
                <div
                  className={`chatbot-bubble ${msg.sender === "user"
                    ? "chatbot-bubble-user"
                    : "chatbot-bubble-bot"
                    }`}
                >
                  {msg.sender === "bot" ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.text}
                    </ReactMarkdown>
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="chatbot-msg chatbot-msg-bot">
                <span className="chatbot-bubble chatbot-bubble-bot chatbot-typing">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/*
            NO <form> TAG - plain div with native input.
            Enter key handled via onKeyDown.
            Send button uses type="button" with onClick.
          */}
          <div className="chatbot-input-area">
            <input
              ref={inputRef}
              type="text"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="chatbot-native-input"
              autoComplete="off"
            />

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                sendMessage();
              }}
              disabled={isLoading || !input.trim()}
              className="chatbot-send-btn"
            >
              {isLoading ? (
                <span className="chatbot-spinner"></span>
              ) : (
                <SendOutlined />
              )}
            </button>
          </div>
        </Card>
      )}

      {!isOpen && (
        <Button
          type="primary"
          icon={<MessageOutlined />}
          onClick={toggleChat}
          className="chatbot-toggle-btn"
        />
      )}
    </div>
  );
};

export default Chatbot;
