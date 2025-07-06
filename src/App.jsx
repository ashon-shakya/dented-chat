import React, { useState, useRef, useEffect } from "react";

// Main App component
const App = () => {
  // State to store chat messages
  const [messages, setMessages] = useState([]);
  // State to store the current input message
  const [inputMessage, setInputMessage] = useState("");
  // State to manage loading indicator during API calls
  const [isLoading, setIsLoading] = useState(false);
  // Ref for scrolling to the latest message
  const messagesEndRef = useRef(null);

  // Effect to scroll to the bottom of the chat window when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /**
   * Handles sending a message to the Gemini API.
   * @param {string} message - The message to send.
   */
  const sendMessage = async (message) => {
    if (!message.trim()) return; // Don't send empty messages

    // Add user message to chat history
    const newUserMessage = { sender: "user", text: message };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setInputMessage(""); // Clear input field

    setIsLoading(true); // Show loading indicator

    try {
      // Prepare chat history for the API call
      // The API expects a specific format for chat history
      let chatHistory = messages.map((msg) => ({
        role: msg.sender === "user" ? "user" : "model",
        parts: [{ text: msg.text }],
      }));
      chatHistory.push({ role: "user", parts: [{ text: message }] }); // Add current user message

      const payload = {
        contents: chatHistory,
        generationConfig: {
          // You can add more generation configurations here if needed
          // For example, temperature, topP, topK
        },
      };

      // Gemini API endpoint and API key (empty string for Canvas environment)
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY; // Canvas will provide this at runtime
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      // Make the API call
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      // Process the API response
      if (
        result.candidates &&
        result.candidates.length > 0 &&
        result.candidates[0].content &&
        result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0
      ) {
        const botResponseText = result.candidates[0].content.parts[0].text;
        // Add bot's response to chat history
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: "bot", text: botResponseText },
        ]);
      } else {
        // Handle cases where the response structure is unexpected
        console.error("Unexpected API response structure:", result);
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            sender: "bot",
            text: "Sorry, I couldn't get a response. Please try again.",
          },
        ]);
      }
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          sender: "bot",
          text: "An error occurred while fetching the response.",
        },
      ]);
    } finally {
      setIsLoading(false); // Hide loading indicator
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
  };

  // Handle form submission (Enter key or Send button)
  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    sendMessage(inputMessage);
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-900">
      <div className="flex flex-col h-[650px] bg-gray-100 font-inter antialiased w-[400px] rounded-4xl overflow-hidden shadow-xl">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-lg rounded-b-lg">
          <h1 className="text-2xl font-bold text-center">Gemini Chatbot</h1>
        </header>

        {/* Chat Area */}
        <main className="flex-1 overflow-y-auto p-4 flex flex-col space-y-4">
          {messages.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-lg">
              Start a conversation!
            </div>
          )}
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-xl shadow-md ${
                  msg.sender === "user"
                    ? "bg-blue-500 text-white rounded-br-none"
                    : "bg-white text-gray-800 rounded-bl-none"
                }`}
              >
                <p className="text-sm md:text-base">{msg.text}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-xl shadow-md bg-white text-gray-800 rounded-bl-none">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} /> {/* Scroll target */}
        </main>

        {/* Input Area */}
        <footer className="p-4 bg-white shadow-lg rounded-t-lg">
          <form onSubmit={handleSubmit} className="flex space-x-3">
            <input
              type="text"
              value={inputMessage}
              onChange={handleInputChange}
              placeholder="Type your message..."
              className="flex-1 p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 ease-in-out"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="bg-blue-600 text-white p-3 rounded-full shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              disabled={isLoading || !inputMessage.trim()}
            >
              {isLoading ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.542 60.542 0 0018.445-8.916.75.75 0 000-1.236A60.542 60.542 0 003.478 2.405z" />
                </svg>
              )}
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
};

export default App;
