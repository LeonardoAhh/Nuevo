"use client"

import { useState, useRef, useEffect } from "react"
import {
  Copy,
  ThumbsDown,
  ThumbsUp,
  RefreshCw,
  Send,
  Paperclip,
  Mic,
  ChevronDown,
  Sparkles,
  Plus,
  Settings,
  Info,
  Sliders,
  Key,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Sample chat history data
const initialChatHistory = [
  {
    id: 1,
    title: "Create welcome form",
    snippet: "Write code HTML, CSS and JS for a simple...",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    selected: true,
  },
  {
    id: 2,
    title: "Instructions",
    snippet: "How to set up a Wi-Fi wireless network?",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    selected: false,
  },
  {
    id: 3,
    title: "Career",
    snippet: "How to organize your working day effectively?",
    timestamp: new Date(Date.now() - 1000 * 60 * 60),
    selected: false,
  },
  {
    id: 4,
    title: "Career",
    snippet: "Tips to improve productivity at work",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    selected: false,
  },
  {
    id: 5,
    title: "Onboarding",
    snippet: "How does artificial intelligence work?",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    selected: false,
  },
  {
    id: 6,
    title: "Onboarding",
    snippet: "What can you do?",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    selected: false,
  },
]

// Sample conversation data
const initialConversation = [
  {
    id: 1,
    role: "user",
    content: "Create a simple HTML form with JavaScript validation",
    timestamp: new Date(Date.now() - 1000 * 60 * 10),
  },
  {
    id: 2,
    role: "assistant",
    content: `Here's a simple HTML form with JavaScript validation:

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Simple Form</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; }
    .form-group { margin-bottom: 15px; }
    label { display: block; margin-bottom: 5px; }
    input { width: 100%; padding: 8px; box-sizing: border-box; }
    button { padding: 10px 15px; background: #4CAF50; color: white; border: none; cursor: pointer; }
    .error { color: red; font-size: 12px; margin-top: 5px; display: none; }
  </style>
</head>
<body>
  <form id="myForm">
    <div class="form-group">
      <label for="name">Name:</label>
      <input type="text" id="name" required>
      <div class="error" id="nameError">Please enter your name</div>
    </div>
    <div class="form-group">
      <label for="email">Email:</label>
      <input type="email" id="email" required>
      <div class="error" id="emailError">Please enter a valid email</div>
    </div>
    <div class="form-group">
      <button type="submit">Submit</button>
      <button type="button" id="cancel-button">Cancel</button>
    </div>
  </form>

  <script>
    let cancelButton = document.getElementById("cancel-button");
    let sendButton = document.querySelector("button[type='submit']");
    
    cancelButton.addEventListener("click", function() {
      console.log("Cancel button clicked");
    });
    
    sendButton.addEventListener("click", function(e) {
      e.preventDefault();
      console.log("Send button clicked");
      
      // Validation
      let valid = true;
      const name = document.getElementById("name");
      const email = document.getElementById("email");
      
      if (!name.value.trim()) {
        document.getElementById("nameError").style.display = "block";
        valid = false;
      } else {
        document.getElementById("nameError").style.display = "none";
      }
      
      if (!email.value.trim() || !email.value.includes("@")) {
        document.getElementById("emailError").style.display = "block";
        valid = false;
      } else {
        document.getElementById("emailError").style.display = "none";
      }
      
      if (valid) {
        alert("Form submitted successfully!");
        document.getElementById("myForm").reset();
      }
    });
  </script>
</body>
</html>
\`\`\`

Note: This is just an example of a simple HTML form. In a real-world scenario, you would also want to include proper validation and handling of the form data on the server side.`,
    timestamp: new Date(Date.now() - 1000 * 60 * 9),
    code: true,
  },
  {
    id: 3,
    role: "user",
    content: "I have created a project in your Codepen account",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
  },
]

// Available AI models with extended configuration
const aiModels = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    icon: "✨",
    apiKey: "",
    baseUrl: "https://api.openai.com/v1",
    temperature: 0.7,
    maxTokens: 4096,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0,
    systemPrompt: "You are a helpful assistant.",
    configured: false,
  },
  {
    id: "claude-3",
    name: "Claude 3",
    provider: "Anthropic",
    icon: "🧠",
    apiKey: "",
    baseUrl: "https://api.anthropic.com/v1",
    temperature: 0.5,
    maxTokens: 4000,
    topP: 0.9,
    systemPrompt: "Human: I need your help with some tasks.\n\nAssistant: I'll do my best to assist you.",
    configured: false,
  },
  {
    id: "gemini-pro",
    name: "Gemini Pro",
    provider: "Google",
    icon: "🔮",
    apiKey: "",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    temperature: 0.8,
    maxTokens: 2048,
    topK: 40,
    topP: 0.95,
    configured: false,
  },
  {
    id: "llama-3",
    name: "Llama 3",
    provider: "Meta",
    icon: "🦙",
    apiKey: "",
    baseUrl: "https://api.together.xyz/v1",
    temperature: 0.6,
    maxTokens: 4096,
    topP: 0.9,
    repetitionPenalty: 1.1,
    configured: false,
  },
]

export default function ChatContent() {
  const [chatHistory, setChatHistory] = useState(initialChatHistory)
  const [conversation, setConversation] = useState(initialConversation)
  const [message, setMessage] = useState("")
  const [models, setModels] = useState(aiModels)
  const [selectedModelId, setSelectedModelId] = useState(aiModels[0].id)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showHistory, setShowHistory] = useState(true)
  const [showModelSettings, setShowModelSettings] = useState(false)
  const [currentModelConfig, setCurrentModelConfig] = useState(null)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  // Get the selected model object
  const selectedModel = models.find((model) => model.id === selectedModelId) || models[0]

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [conversation])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])

  const handleSendMessage = () => {
    if (!message.trim()) return

    // Add user message to conversation
    const newUserMessage = {
      id: conversation.length + 1,
      role: "user",
      content: message,
      timestamp: new Date(),
    }
    setConversation([...conversation, newUserMessage])
    setMessage("")

    // Check if model is configured
    if (!selectedModel.configured && selectedModel.apiKey === "") {
      // Add system message about missing API key
      setTimeout(() => {
        const systemMessage = {
          id: conversation.length + 2,
          role: "system",
          content: `Please configure your ${selectedModel.name} API key in the model settings to use this model.`,
          timestamp: new Date(),
          isError: true,
        }
        setConversation((prev) => [...prev, systemMessage])
        setIsGenerating(false)
      }, 500)
      return
    }

    // Simulate AI response
    setIsGenerating(true)
    setTimeout(() => {
      const newAiMessage = {
        id: conversation.length + 2,
        role: "assistant",
        content: `This is a simulated response from ${selectedModel.name}. In a real application, this would be generated by the AI model using your configured settings.`,
        timestamp: new Date(),
      }
      setConversation((prev) => [...prev, newAiMessage])
      setIsGenerating(false)

      // Update chat history with new conversation
      const newHistoryItem = {
        id: chatHistory.length + 1,
        title: message.length > 20 ? message.substring(0, 20) + "..." : message,
        snippet: message,
        timestamp: new Date(),
        selected: true,
      }
      setChatHistory([{ ...newHistoryItem }, ...chatHistory.map((item) => ({ ...item, selected: false }))])
    }, 1500)
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSelectChat = (id) => {
    setChatHistory(
      chatHistory.map((chat) => ({
        ...chat,
        selected: chat.id === id,
      })),
    )
  }

  const handleNewChat = () => {
    // Deselect all chats in history
    setChatHistory(chatHistory.map((chat) => ({ ...chat, selected: false })))
    // Clear conversation
    setConversation([])
  }

  const handleRegenerateResponse = () => {
    if (conversation.length === 0) return

    // Find the last assistant message
    const lastAssistantIndex = [...conversation].reverse().findIndex((msg) => msg.role === "assistant")

    if (lastAssistantIndex !== -1) {
      // Remove the last assistant message
      const newConversation = conversation.slice(0, conversation.length - lastAssistantIndex - 1)
      setConversation(newConversation)

      // Simulate generating a new response
      setIsGenerating(true)
      setTimeout(() => {
        const newAiMessage = {
          id: newConversation.length + 1,
          role: "assistant",
          content: `This is a regenerated response from ${selectedModel.name}.`,
          timestamp: new Date(),
        }
        setConversation([...newConversation, newAiMessage])
        setIsGenerating(false)
      }, 1500)
    }
  }

  const formatTimestamp = (timestamp) => {
    const now = new Date()
    const date = new Date(timestamp)

    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }

    // If this year, show month and day
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    }

    // Otherwise show full date
    return date.toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" })
  }

  const openModelSettings = (model) => {
    setCurrentModelConfig({ ...model })
    setShowModelSettings(true)
  }

  const saveModelSettings = () => {
    if (!currentModelConfig) return

    setModels(
      models.map((model) =>
        model.id === currentModelConfig.id ? { ...currentModelConfig, configured: !!currentModelConfig.apiKey } : model,
      ),
    )
    setShowModelSettings(false)
  }

  const clearHistory = () => {
    if (confirm("Are you sure you want to clear all chat history? This cannot be undone.")) {
      setChatHistory([])
      setConversation([])
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)]">
      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col ${showHistory ? "mr-4" : ""}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold">AI Chat Assistant</h1>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={selectedModelId}
              onValueChange={(value) => {
                setSelectedModelId(value)
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{selectedModel.icon}</span>
                    <span>{selectedModel.name}</span>
                    {!selectedModel.configured && <AlertCircle size={14} className="text-amber-500 ml-1" />}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.id} value={model.id} className="flex justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{model.icon}</span>
                      <div>
                        <div className="flex items-center">
                          {model.name}
                          {!model.configured && <AlertCircle size={14} className="text-amber-500 ml-1" />}
                        </div>
                        <div className="text-xs text-gray-500">{model.provider}</div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-2"
                      onClick={(e) => {
                        e.stopPropagation()
                        openModelSettings(model)
                      }}
                    >
                      <Settings size={14} />
                    </Button>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => openModelSettings(selectedModel)} className="relative">
              <Settings size={18} />
              {!selectedModel.configured && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-amber-500 rounded-full border-2 border-white"></span>
              )}
            </Button>
            <Button variant="outline" size="icon" onClick={() => setShowHistory(!showHistory)}>
              {showHistory ? <ChevronDown /> : <ChevronDown className="rotate-180" />}
            </Button>
          </div>
        </div>

        {/* Chat Messages */}
        <Card className="flex-1 overflow-hidden">
          <CardContent className="p-0 h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 dark:text-gray-100">
              {conversation.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <Sparkles className="h-8 w-8 text-gray-400 dark:text-gray-300" />
                  </div>
                  <h3 className="text-lg font-medium mb-2 dark:text-gray-100">How can I help you today?</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-md">
                    Ask me anything - from coding help to creative writing, research assistance, and more.
                  </p>
                </div>
              ) : (
                conversation.map((msg) => (
                  <div
                    key={msg.id}
                    className={`mb-6 ${
                      msg.role === "user"
                        ? "flex justify-end"
                        : msg.role === "system"
                          ? "flex justify-center"
                          : "flex justify-start"
                    }`}
                  >
                    {msg.role === "system" ? (
                      <Alert variant="destructive" className="max-w-md">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{msg.content}</AlertDescription>
                      </Alert>
                    ) : (
                      <div
                        className={`max-w-3xl ${
                          msg.role === "user"
                            ? "bg-gray-100 dark:bg-gray-800 rounded-t-lg rounded-l-lg"
                            : "bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-t-lg rounded-r-lg"
                        } p-4`}
                      >
                        {msg.role === "assistant" && (
                          <div className="flex items-center gap-2 mb-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="text-lg">{selectedModel.icon}</span>
                            <span>{selectedModel.name}</span>
                          </div>
                        )}

                        {msg.code ? (
                          <div>
                            <div className="whitespace-pre-wrap mb-4">{msg.content.split("```")[0]}</div>
                            <div className="bg-gray-900 text-white dark:bg-black dark:border dark:border-gray-800 rounded-md overflow-hidden">
                              <div className="flex items-center justify-between px-4 py-2 bg-gray-800">
                                <div className="flex gap-2">
                                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-gray-300">
                                    HTML
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-gray-300">
                                    CSS
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs text-gray-300 bg-gray-700"
                                  >
                                    JS
                                  </Button>
                                </div>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-300">
                                        <Copy size={14} />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Copy code</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                              <pre className="p-4 overflow-x-auto text-sm">
                                <code>{msg.content.split("```")[1].split("```")[0]}</code>
                              </pre>
                            </div>
                            <div className="whitespace-pre-wrap mt-4">{msg.content.split("```")[2]}</div>
                          </div>
                        ) : (
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        )}

                        <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>{formatTimestamp(msg.timestamp)}</span>

                          {msg.role === "assistant" && (
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <ThumbsUp size={14} />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <ThumbsDown size={14} />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <Copy size={14} />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
              {isGenerating && (
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <div className="flex space-x-1">
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></div>
                  </div>
                  <span>{selectedModel.name} is thinking...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Regenerate Response Button */}
            {conversation.length > 0 && !isGenerating && (
              <div className="flex justify-center py-2 border-t">
                <Button variant="outline" size="sm" className="gap-2" onClick={handleRegenerateResponse}>
                  <RefreshCw size={14} />
                  Regenerate response
                </Button>
              </div>
            )}

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message AI Chat Assistant..."
                  className="pr-24 min-h-[60px] max-h-[200px] resize-none"
                  rows={1}
                />
                <div className="absolute right-2 bottom-2 flex items-center gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Paperclip size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Attach file</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Mic size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Voice input</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || isGenerating}
                    size="sm"
                    className="h-8 px-3 bg-gray-900 hover:bg-black text-white"
                  >
                    <Send size={14} className="mr-1" />
                    Send
                  </Button>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
                <div>
                  Free Research Preview. {selectedModel.name} may produce inaccurate information about people, places,
                  or facts.
                </div>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={clearHistory}>
                  Clear history
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat History Sidebar */}
      {showHistory && (
        <div className="w-80 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">History</h2>
            <span className="text-xs text-gray-500">{chatHistory.length}/50</span>
          </div>

          <Button variant="outline" className="mb-4 gap-2 justify-start" onClick={handleNewChat}>
            <Plus size={16} />
            New chat
          </Button>

          <div className="flex-1 overflow-y-auto space-y-2">
            {chatHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No chat history yet</div>
            ) : (
              chatHistory.map((chat) => (
                <div
                  key={chat.id}
                  className={`p-3 rounded-lg cursor-pointer ${
                    chat.selected ? "bg-gray-100 border-gray-300" : "hover:bg-gray-50"
                  }`}
                  onClick={() => handleSelectChat(chat.id)}
                >
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={chat.selected}
                      onChange={() => handleSelectChat(chat.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{chat.title}</div>
                      <div className="text-sm text-gray-500 truncate">{chat.snippet}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="mt-4 text-xs justify-center"
            onClick={clearHistory}
            disabled={chatHistory.length === 0}
          >
            Clear history
          </Button>
        </div>
      )}

      {/* Model Settings Dialog */}
      <Dialog open={showModelSettings} onOpenChange={setShowModelSettings}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {currentModelConfig?.icon && <span className="text-lg">{currentModelConfig.icon}</span>}
              {currentModelConfig?.name} Settings
            </DialogTitle>
            <DialogDescription>
              Configure your {currentModelConfig?.provider} API settings for {currentModelConfig?.name}
            </DialogDescription>
          </DialogHeader>

          {currentModelConfig && (
            <Tabs defaultValue="api" className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="api" className="flex items-center gap-1">
                  <Key size={14} />
                  API Settings
                </TabsTrigger>
                <TabsTrigger value="parameters" className="flex items-center gap-1">
                  <Sliders size={14} />
                  Parameters
                </TabsTrigger>
                <TabsTrigger value="system" className="flex items-center gap-1">
                  <Info size={14} />
                  System Prompt
                </TabsTrigger>
              </TabsList>

              <TabsContent value="api" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">
                      API Key {!currentModelConfig.apiKey && <span className="text-red-500">*</span>}
                    </Label>
                    <div className="relative">
                      <Input
                        id="apiKey"
                        type="password"
                        value={currentModelConfig.apiKey || ""}
                        onChange={(e) => setCurrentModelConfig({ ...currentModelConfig, apiKey: e.target.value })}
                        placeholder={`Enter your ${currentModelConfig.provider} API key`}
                        className="pr-10"
                      />
                      {currentModelConfig.apiKey && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => setCurrentModelConfig({ ...currentModelConfig, apiKey: "" })}
                        >
                          <span className="sr-only">Clear API key</span>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-x"
                          >
                            <path d="M18 6 6 18" />
                            <path d="m6 6 12 12" />
                          </svg>
                        </Button>
                      )}
                    </div>
                    {!currentModelConfig.apiKey && (
                      <p className="text-xs text-amber-500">API key is required to use this model</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="baseUrl">Base URL</Label>
                    <Input
                      id="baseUrl"
                      value={currentModelConfig.baseUrl || ""}
                      onChange={(e) => setCurrentModelConfig({ ...currentModelConfig, baseUrl: e.target.value })}
                      placeholder="API endpoint URL"
                    />
                    <p className="text-xs text-gray-500">Leave as default unless using a proxy or custom endpoint</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="saveApiKey"
                      checked={currentModelConfig.saveApiKey || false}
                      onCheckedChange={(checked) =>
                        setCurrentModelConfig({ ...currentModelConfig, saveApiKey: checked })
                      }
                    />
                    <Label htmlFor="saveApiKey">Save API key in browser storage</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="parameters" className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="temperature">Temperature: {currentModelConfig.temperature}</Label>
                      <span className="text-xs text-gray-500">Controls randomness</span>
                    </div>
                    <Slider
                      id="temperature"
                      min={0}
                      max={2}
                      step={0.1}
                      value={[currentModelConfig.temperature || 0.7]}
                      onValueChange={(value) => setCurrentModelConfig({ ...currentModelConfig, temperature: value[0] })}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Precise (0)</span>
                      <span>Balanced (1)</span>
                      <span>Creative (2)</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="maxTokens">Max Tokens: {currentModelConfig.maxTokens}</Label>
                      <span className="text-xs text-gray-500">Maximum response length</span>
                    </div>
                    <Slider
                      id="maxTokens"
                      min={256}
                      max={8192}
                      step={256}
                      value={[currentModelConfig.maxTokens || 4096]}
                      onValueChange={(value) => setCurrentModelConfig({ ...currentModelConfig, maxTokens: value[0] })}
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Short</span>
                      <span>Medium</span>
                      <span>Long</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="topP">Top P: {currentModelConfig.topP}</Label>
                      <span className="text-xs text-gray-500">Controls diversity</span>
                    </div>
                    <Slider
                      id="topP"
                      min={0.1}
                      max={1}
                      step={0.05}
                      value={[currentModelConfig.topP || 1]}
                      onValueChange={(value) => setCurrentModelConfig({ ...currentModelConfig, topP: value[0] })}
                    />
                  </div>

                  {currentModelConfig.provider === "OpenAI" && (
                    <>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label htmlFor="frequencyPenalty">
                            Frequency Penalty: {currentModelConfig.frequencyPenalty}
                          </Label>
                        </div>
                        <Slider
                          id="frequencyPenalty"
                          min={-2}
                          max={2}
                          step={0.1}
                          value={[currentModelConfig.frequencyPenalty || 0]}
                          onValueChange={(value) =>
                            setCurrentModelConfig({ ...currentModelConfig, frequencyPenalty: value[0] })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label htmlFor="presencePenalty">
                            Presence Penalty: {currentModelConfig.presencePenalty}
                          </Label>
                        </div>
                        <Slider
                          id="presencePenalty"
                          min={-2}
                          max={2}
                          step={0.1}
                          value={[currentModelConfig.presencePenalty || 0]}
                          onValueChange={(value) =>
                            setCurrentModelConfig({ ...currentModelConfig, presencePenalty: value[0] })
                          }
                        />
                      </div>
                    </>
                  )}

                  {currentModelConfig.provider === "Meta" && (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="repetitionPenalty">
                          Repetition Penalty: {currentModelConfig.repetitionPenalty}
                        </Label>
                      </div>
                      <Slider
                        id="repetitionPenalty"
                        min={0.1}
                        max={2}
                        step={0.1}
                        value={[currentModelConfig.repetitionPenalty || 1.1]}
                        onValueChange={(value) =>
                          setCurrentModelConfig({ ...currentModelConfig, repetitionPenalty: value[0] })
                        }
                      />
                    </div>
                  )}

                  {currentModelConfig.provider === "Google" && (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="topK">Top K: {currentModelConfig.topK}</Label>
                      </div>
                      <Slider
                        id="topK"
                        min={1}
                        max={100}
                        step={1}
                        value={[currentModelConfig.topK || 40]}
                        onValueChange={(value) => setCurrentModelConfig({ ...currentModelConfig, topK: value[0] })}
                      />
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="system" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="systemPrompt">System Prompt</Label>
                  <Textarea
                    id="systemPrompt"
                    value={currentModelConfig.systemPrompt || ""}
                    onChange={(e) => setCurrentModelConfig({ ...currentModelConfig, systemPrompt: e.target.value })}
                    placeholder="Instructions for the AI model"
                    className="min-h-[200px]"
                  />
                  <p className="text-xs text-gray-500">
                    The system prompt helps set the behavior of the assistant. For example: "You are a helpful assistant
                    that specializes in coding."
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">System Prompt Templates</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentModelConfig({
                          ...currentModelConfig,
                          systemPrompt: "You are a helpful, creative, and concise assistant.",
                        })
                      }
                    >
                      General Assistant
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentModelConfig({
                          ...currentModelConfig,
                          systemPrompt:
                            "You are a programming expert that provides clear, concise code examples with explanations.",
                        })
                      }
                    >
                      Code Expert
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentModelConfig({
                          ...currentModelConfig,
                          systemPrompt:
                            "You are a writing assistant that helps improve text clarity, grammar, and style.",
                        })
                      }
                    >
                      Writing Assistant
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentModelConfig({
                          ...currentModelConfig,
                          systemPrompt:
                            "You are a data analysis expert that helps interpret information and create visualizations.",
                        })
                      }
                    >
                      Data Analyst
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <div className="flex items-center justify-between w-full">
              <div>
                {currentModelConfig?.configured && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
                    Configured
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowModelSettings(false)}>
                  Cancel
                </Button>
                <Button onClick={saveModelSettings}>Save Settings</Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
