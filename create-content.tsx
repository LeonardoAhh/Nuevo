"use client"

import { useState } from "react"
import {
  ArrowLeft,
  Calendar,
  Clock,
  ExternalLink,
  Globe,
  ImageIcon,
  Link,
  List,
  Plus,
  Save,
  Trash2,
  X,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { format } from "date-fns"

// Form validation types
type ValidationErrors = {
  [key: string]: string
}

// URL validation regex
const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/

// Simple markdown renderer
const MarkdownPreview = ({ markdown }) => {
  // Convert markdown to HTML (very basic implementation)
  const renderMarkdown = (text) => {
    if (!text) return ""

    // Replace headers
    let html = text
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-5 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')

    // Replace bold and italic
    html = html.replace(/\*\*(.*)\*\*/gim, "<strong>$1</strong>").replace(/\*(.*)\*/gim, "<em>$1</em>")

    // Replace links - removed hover:underline class
    html = html.replace(/\[([^\]]+)\]$$([^)]+)$$/gim, '<a href="$2" class="text-blue-500">$1</a>')

    // Replace lists
    html = html.replace(/^\s*\*\s(.*)/gim, '<li class="ml-6 list-disc">$1</li>')
    html = html.replace(/^\s*\d\.\s(.*)/gim, '<li class="ml-6 list-decimal">$1</li>')

    // Replace paragraphs
    html = html.replace(/^(?!<[hl]|<li)(.*$)/gim, '<p class="mb-4">$1</p>')

    // Replace images
    html = html.replace(/!\[([^\]]+)\]$$([^)]+)$$/gim, '<img src="$2" alt="$1" class="my-4 rounded-md max-w-full" />')

    // Replace code blocks
    html = html.replace(
      /```([\s\S]*?)```/gim,
      '<pre class="bg-gray-100 p-4 rounded-md my-4 overflow-x-auto"><code>$1</code></pre>',
    )

    // Replace inline code
    html = html.replace(/`([^`]+)`/gim, '<code class="bg-gray-100 px-1 py-0.5 rounded">$1</code>')

    // Replace horizontal rules
    html = html.replace(/^\s*---\s*$/gim, '<hr class="my-4 border-t border-gray-300" />')

    return html
  }

  return <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }} />
}

export default function CreateContent() {
  // Basic project info
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [content, setContent] = useState(`# Project Overview

This is a detailed description of the project. You can edit this content or delete it and start from scratch.

## Challenges

Describe the challenges faced during this project.

## Solutions

Explain the solutions implemented to overcome the challenges.

## Key Features

* Feature 1
* Feature 2
* Feature 3

## Results

Describe the outcomes and results of the project.
`)
  const [client, setClient] = useState("")
  const [livePreview, setLivePreview] = useState("")
  const [status, setStatus] = useState("in-progress")
  const [isPublic, setIsPublic] = useState(true)
  const [projectType, setProjectType] = useState("personal")

  // Images
  const [images, setImages] = useState([])
  const [imageInput, setImageInput] = useState("")

  // Categories and tags
  const [projectCategories, setProjectCategories] = useState([])
  const [categoryInput, setCategoryInput] = useState("")
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState("")

  // Social links
  const [social, setSocial] = useState({
    facebook: "",
    twitter: "",
    linkedin: "",
    website: "",
  })

  // Key features and solutions
  const [keyFeatures, setKeyFeatures] = useState([])
  const [keyFeatureInput, setKeyFeatureInput] = useState("")
  const [solutions, setSolutions] = useState([])
  const [solutionInput, setSolutionInput] = useState("")
  const [challenges, setChallenges] = useState("")

  // Timeline
  const [projectTimeline, setProjectTimeline] = useState([])
  const [timelineTitle, setTimelineTitle] = useState("")
  const [timelineDuration, setTimelineDuration] = useState("")

  // Dates
  const [releaseDate, setReleaseDate] = useState(null)
  const [completeDate, setCompleteDate] = useState(null)

  // Form validation
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [formSubmitted, setFormSubmitted] = useState(false)

  // Generate slug from title
  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .replace(/[^\w ]+/g, "")
      .replace(/ +/g, "-")
  }

  // Handle title change and auto-generate slug
  const handleTitleChange = (e) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    setSlug(generateSlug(newTitle))

    // Clear error when user types
    if (errors.title) {
      setErrors({ ...errors, title: "" })
    }
  }

  // Handle adding an image
  const handleAddImage = () => {
    if (!imageInput.trim()) return

    // Validate URL
    if (!urlRegex.test(imageInput.trim())) {
      setErrors({ ...errors, imageInput: "Please enter a valid URL" })
      return
    }

    setImages([...images, imageInput.trim()])
    setImageInput("")
    setErrors({ ...errors, imageInput: "" })
  }

  // Handle removing an image
  const handleRemoveImage = (index) => {
    setImages(images.filter((_, i) => i !== index))
  }

  // Handle adding a category
  const handleAddCategory = () => {
    if (!categoryInput.trim() || projectCategories.includes(categoryInput.trim())) return
    setProjectCategories([...projectCategories, categoryInput.trim()])
    setCategoryInput("")
  }

  // Handle removing a category
  const handleRemoveCategory = (category) => {
    setProjectCategories(projectCategories.filter((c) => c !== category))
  }

  // Handle adding a tag
  const handleAddTag = () => {
    if (!tagInput.trim() || tags.includes(tagInput.trim())) return
    setTags([...tags, tagInput.trim()])
    setTagInput("")
  }

  // Handle removing a tag
  const handleRemoveTag = (tag) => {
    setTags(tags.filter((t) => t !== tag))
  }

  // Handle adding a key feature
  const handleAddKeyFeature = () => {
    if (!keyFeatureInput.trim()) return
    setKeyFeatures([...keyFeatures, keyFeatureInput.trim()])
    setKeyFeatureInput("")
  }

  // Handle removing a key feature
  const handleRemoveKeyFeature = (feature) => {
    setKeyFeatures(keyFeatures.filter((f) => f !== feature))
  }

  // Handle adding a solution
  const handleAddSolution = () => {
    if (!solutionInput.trim()) return
    setSolutions([...solutions, solutionInput.trim()])
    setSolutionInput("")
  }

  // Handle removing a solution
  const handleRemoveSolution = (solution) => {
    setSolutions(solutions.filter((s) => s !== solution))
  }

  // Handle adding a timeline item
  const handleAddTimelineItem = () => {
    if (!timelineTitle.trim() || !timelineDuration.trim()) {
      setErrors({
        ...errors,
        timelineTitle: !timelineTitle.trim() ? "Title is required" : "",
        timelineDuration: !timelineDuration.trim() ? "Duration is required" : "",
      })
      return
    }

    setProjectTimeline([...projectTimeline, { title: timelineTitle.trim(), duration: timelineDuration.trim() }])
    setTimelineTitle("")
    setTimelineDuration("")
    setErrors({ ...errors, timelineTitle: "", timelineDuration: "" })
  }

  // Handle removing a timeline item
  const handleRemoveTimelineItem = (index) => {
    setProjectTimeline(projectTimeline.filter((_, i) => i !== index))
  }

  // Handle social media input changes
  const handleSocialChange = (platform, value) => {
    setSocial({
      ...social,
      [platform]: value,
    })

    // Clear error when user types
    if (errors[`social_${platform}`]) {
      setErrors({ ...errors, [`social_${platform}`]: "" })
    }
  }

  // Validate form
  const validateForm = () => {
    const newErrors: ValidationErrors = {}

    // Required fields
    if (!title.trim()) newErrors.title = "Title is required"
    if (!description.trim()) newErrors.description = "Description is required"
    if (!content.trim()) newErrors.content = "Content is required"
    if (solutions.length === 0) newErrors.solutions = "At least one solution is required"

    // URL validations
    if (livePreview && !urlRegex.test(livePreview)) {
      newErrors.livePreview = "Please enter a valid URL"
    }

    // Social URLs validation
    Object.entries(social).forEach(([key, value]) => {
      if (value && !urlRegex.test(value)) {
        newErrors[`social_${key}`] = "Please enter a valid URL"
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSave = () => {
    setFormSubmitted(true)

    if (!validateForm()) {
      // Scroll to the first error
      const firstErrorElement = document.querySelector('[data-error="true"]')
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: "smooth", block: "center" })
      }
      return
    }

    // In a real app, this would save to a database
    const newProject = {
      title,
      slug,
      images,
      description,
      content,
      client,
      projectCategory: projectCategories,
      tags,
      livePreview,
      status,
      social,
      keyFeature: keyFeatures,
      isPublic,
      solutions,
      challenges,
      projectTimeline,
      releaseDate,
      completeDate,
      projectType,
      createdAt: new Date().toISOString(),
    }

    console.log("Saving project:", newProject)
    alert("Project saved successfully!")

    // Here you would typically redirect to the portfolio page or clear the form
  }

  // Insert markdown syntax
  const insertMarkdownSyntax = (syntax, placeholder = "") => {
    const textarea = document.getElementById("markdown-editor")
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = content

    const beforeSelection = text.substring(0, start)
    const selection = text.substring(start, end) || placeholder
    const afterSelection = text.substring(end)

    const newText = beforeSelection + syntax.replace("$1", selection) + afterSelection
    setContent(newText)

    // Focus back on the textarea
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + syntax.indexOf("$1"), start + syntax.indexOf("$1") + selection.length)
    }, 0)
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <a href="/portfolio">
              <ArrowLeft size={16} />
            </a>
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Create New Project</h1>
            <p className="text-gray-500 text-sm sm:text-base">Create and publish your project with all details</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button className="gap-2 bg-gray-900 hover:bg-black text-white w-full sm:w-auto" onClick={handleSave}>
            <Save size={16} />
            Save {isPublic ? "& Publish" : "Draft"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4">
                <div data-error={!!errors.title && formSubmitted}>
                  <Label htmlFor="title" className="flex justify-between">
                    <span>
                      Project Title <span className="text-red-500">*</span>
                    </span>
                    {errors.title && formSubmitted && <span className="text-red-500 text-xs">{errors.title}</span>}
                  </Label>
                  <Input
                    id="title"
                    placeholder="Enter project title"
                    value={title}
                    onChange={handleTitleChange}
                    className={`text-lg font-medium ${errors.title && formSubmitted ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      placeholder="project-slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="client">Client</Label>
                    <Input
                      id="client"
                      placeholder="Client name"
                      value={client}
                      onChange={(e) => setClient(e.target.value)}
                    />
                  </div>
                </div>

                <div data-error={!!errors.description && formSubmitted}>
                  <Label htmlFor="description" className="flex justify-between">
                    <span>
                      Short Description <span className="text-red-500">*</span>
                    </span>
                    {errors.description && formSubmitted && (
                      <span className="text-red-500 text-xs">{errors.description}</span>
                    )}
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the project"
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value)
                      if (errors.description) setErrors({ ...errors, description: "" })
                    }}
                    className={`h-24 ${errors.description && formSubmitted ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                  />
                </div>

                <div data-error={!!errors.content && formSubmitted}>
                  <Label className="flex justify-between">
                    <span>
                      Detailed Content <span className="text-red-500">*</span>
                    </span>
                    {errors.content && formSubmitted && <span className="text-red-500 text-xs">{errors.content}</span>}
                  </Label>
                  <Tabs defaultValue="edit" className="w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                      <TabsList>
                        <TabsTrigger value="edit">Edit</TabsTrigger>
                        <TabsTrigger value="preview">Preview</TabsTrigger>
                      </TabsList>

                      <div className="flex flex-wrap gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => insertMarkdownSyntax("# $1", "Heading 1")}
                        >
                          H1
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => insertMarkdownSyntax("## $1", "Heading 2")}
                        >
                          H2
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => insertMarkdownSyntax("**$1**", "Bold text")}
                        >
                          B
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => insertMarkdownSyntax("*$1*", "Italic text")}
                        >
                          I
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => insertMarkdownSyntax("[Link text]($1)", "https://example.com")}
                        >
                          <Link size={14} />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => insertMarkdownSyntax("![Image alt]($1)", "https://example.com/image.jpg")}
                        >
                          <ImageIcon size={14} />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => insertMarkdownSyntax("* $1", "List item")}
                        >
                          <List size={14} />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-2">
                      <TabsContent value="edit">
                        <Textarea
                          id="markdown-editor"
                          placeholder="Write your content using Markdown..."
                          value={content}
                          onChange={(e) => {
                            setContent(e.target.value)
                            if (errors.content) setErrors({ ...errors, content: "" })
                          }}
                          className={`min-h-[300px] sm:min-h-[400px] font-mono text-sm ${errors.content && formSubmitted ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                        />
                      </TabsContent>
                      <TabsContent value="preview">
                        <div className="min-h-[300px] sm:min-h-[400px] border rounded-md p-4 overflow-auto bg-white">
                          <MarkdownPreview markdown={content} />
                        </div>
                      </TabsContent>
                    </div>
                  </Tabs>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <h3 className="text-lg font-medium mb-4">Project Images</h3>
                <div className="space-y-4">
                  <div data-error={!!errors.imageInput}>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Image URL"
                        value={imageInput}
                        onChange={(e) => {
                          setImageInput(e.target.value)
                          if (errors.imageInput) setErrors({ ...errors, imageInput: "" })
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            handleAddImage()
                          }
                        }}
                        className={errors.imageInput ? "border-red-500 focus-visible:ring-red-500" : ""}
                      />
                      <Button type="button" onClick={handleAddImage} variant="outline">
                        Add
                      </Button>
                    </div>
                    {errors.imageInput && <p className="text-red-500 text-xs mt-1">{errors.imageInput}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image || "/placeholder.svg"}
                          alt={`Project image ${index + 1}`}
                          className="w-full h-24 object-cover rounded-md"
                          onError={(e) => {
                            e.currentTarget.src = "/colorful-abstract-flow.png"
                          }}
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveImage(index)}
                        >
                          <X size={12} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <h3 className="text-lg font-medium mb-4">Challenges & Solutions</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="challenges">Challenges</Label>
                    <Textarea
                      id="challenges"
                      placeholder="Describe the challenges faced"
                      value={challenges}
                      onChange={(e) => setChallenges(e.target.value)}
                      className="h-24"
                    />
                  </div>

                  <div data-error={!!errors.solutions && formSubmitted}>
                    <Label htmlFor="solutions" className="flex justify-between">
                      <span>
                        Solutions <span className="text-red-500">*</span>
                      </span>
                      <span
                        className={`text-xs ${errors.solutions && formSubmitted ? "text-red-500" : "text-gray-500"}`}
                      >
                        {solutions.length} items {errors.solutions && formSubmitted ? `- ${errors.solutions}` : ""}
                      </span>
                    </Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        id="solutions"
                        placeholder="Add solution"
                        value={solutionInput}
                        onChange={(e) => setSolutionInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            handleAddSolution()
                          }
                        }}
                        className={errors.solutions && formSubmitted ? "border-red-500 focus-visible:ring-red-500" : ""}
                      />
                      <Button
                        type="button"
                        onClick={handleAddSolution}
                        variant="outline"
                        className={errors.solutions && formSubmitted ? "border-red-500" : ""}
                      >
                        <Plus size={16} />
                      </Button>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {solutions.map((solution, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                          <span>{solution}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-gray-500 hover:text-red-500"
                            onClick={() => handleRemoveSolution(solution)}
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <Accordion type="multiple" defaultValue={["project-type", "status"]}>
                <AccordionItem value="project-type">
                  <AccordionTrigger>Project Type & Status</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="project-type" className="block mb-2">
                          Project Type
                        </Label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <Button
                            type="button"
                            variant={projectType === "personal" ? "default" : "outline"}
                            className={projectType === "personal" ? "bg-gray-900 text-white" : ""}
                            onClick={() => setProjectType("personal")}
                          >
                            Personal
                          </Button>
                          <Button
                            type="button"
                            variant={projectType === "company" ? "default" : "outline"}
                            className={projectType === "company" ? "bg-gray-900 text-white" : ""}
                            onClick={() => setProjectType("company")}
                          >
                            Company
                          </Button>
                          <Button
                            type="button"
                            variant={projectType === "openSource" ? "default" : "outline"}
                            className={projectType === "openSource" ? "bg-gray-900 text-white" : ""}
                            onClick={() => setProjectType("openSource")}
                          >
                            Open Source
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="status" className="block mb-2">
                          Status
                        </Label>
                        <Select value={status} onValueChange={setStatus}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="planning">Planning</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="on-hold">On Hold</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div data-error={!!errors.livePreview}>
                        <Label htmlFor="live-preview" className="block mb-2">
                          Live Preview URL
                        </Label>
                        <div className="flex">
                          <Input
                            id="live-preview"
                            placeholder="https://example.com"
                            value={livePreview}
                            onChange={(e) => {
                              setLivePreview(e.target.value)
                              if (errors.livePreview) setErrors({ ...errors, livePreview: "" })
                            }}
                            className={`rounded-r-none ${errors.livePreview ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                          />
                          {livePreview && (
                            <Button
                              variant="outline"
                              className="rounded-l-none border-l-0"
                              onClick={() => window.open(livePreview, "_blank")}
                            >
                              <ExternalLink size={16} />
                            </Button>
                          )}
                        </div>
                        {errors.livePreview && <p className="text-red-500 text-xs mt-1">{errors.livePreview}</p>}
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="is-public">Make project public</Label>
                        <Switch id="is-public" checked={isPublic} onCheckedChange={setIsPublic} />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="categories-tags">
                  <AccordionTrigger className="no-underline hover:no-underline">Categories & Tags</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="categories" className="block mb-2">
                          Project Categories
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="categories"
                            placeholder="Add category"
                            value={categoryInput}
                            onChange={(e) => setCategoryInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault()
                                handleAddCategory()
                              }
                            }}
                          />
                          <Button type="button" onClick={handleAddCategory} variant="outline">
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {projectCategories.map((category, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                              {category}
                              <X size={14} className="cursor-pointer" onClick={() => handleRemoveCategory(category)} />
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="tags" className="block mb-2">
                          Tags
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="tags"
                            placeholder="Add tag"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault()
                                handleAddTag()
                              }
                            }}
                          />
                          <Button type="button" onClick={handleAddTag} variant="outline">
                            Add
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                              {tag}
                              <X size={14} className="cursor-pointer" onClick={() => handleRemoveTag(tag)} />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="key-features">
                  <AccordionTrigger>Key Features</AccordionTrigger>
                  <AccordionContent>
                    <div>
                      <div className="flex gap-2 mb-2">
                        <Input
                          placeholder="Add key feature"
                          value={keyFeatureInput}
                          onChange={(e) => setKeyFeatureInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              handleAddKeyFeature()
                            }
                          }}
                        />
                        <Button type="button" onClick={handleAddKeyFeature} variant="outline">
                          <Plus size={16} />
                        </Button>
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {keyFeatures.map((feature, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                            <span>{feature}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-gray-500 hover:text-red-500"
                              onClick={() => handleRemoveKeyFeature(feature)}
                            >
                              <X size={14} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="timeline">
                  <AccordionTrigger>Project Timeline</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="release-date">Release Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left font-normal">
                                <Calendar className="mr-2 h-4 w-4" />
                                {releaseDate ? format(releaseDate, "PPP") : <span>Pick a date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <CalendarComponent
                                mode="single"
                                selected={releaseDate}
                                onSelect={setReleaseDate}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div>
                          <Label htmlFor="complete-date">Completion Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left font-normal">
                                <Calendar className="mr-2 h-4 w-4" />
                                {completeDate ? format(completeDate, "PPP") : <span>Pick a date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <CalendarComponent
                                mode="single"
                                selected={completeDate}
                                onSelect={setCompleteDate}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      <div>
                        <Label className="block mb-2">Timeline Events</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                          <div data-error={!!errors.timelineTitle}>
                            <Input
                              placeholder="Event title"
                              value={timelineTitle}
                              onChange={(e) => {
                                setTimelineTitle(e.target.value)
                                if (errors.timelineTitle) setErrors({ ...errors, timelineTitle: "" })
                              }}
                              className={errors.timelineTitle ? "border-red-500 focus-visible:ring-red-500" : ""}
                            />
                            {errors.timelineTitle && (
                              <p className="text-red-500 text-xs mt-1">{errors.timelineTitle}</p>
                            )}
                          </div>
                          <div data-error={!!errors.timelineDuration}>
                            <Input
                              placeholder="Duration (e.g., 2 weeks)"
                              value={timelineDuration}
                              onChange={(e) => {
                                setTimelineDuration(e.target.value)
                                if (errors.timelineDuration) setErrors({ ...errors, timelineDuration: "" })
                              }}
                              className={errors.timelineDuration ? "border-red-500 focus-visible:ring-red-500" : ""}
                            />
                            {errors.timelineDuration && (
                              <p className="text-red-500 text-xs mt-1">{errors.timelineDuration}</p>
                            )}
                          </div>
                        </div>
                        <Button type="button" onClick={handleAddTimelineItem} variant="outline" className="w-full mb-2">
                          Add Timeline Event
                        </Button>

                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {projectTimeline.map((item, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                              <div>
                                <div className="font-medium">{item.title}</div>
                                <div className="text-sm text-gray-500 flex items-center">
                                  <Clock size={12} className="mr-1" />
                                  {item.duration}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-gray-500 hover:text-red-500"
                                onClick={() => handleRemoveTimelineItem(index)}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="social">
                  <AccordionTrigger>Social Links</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <div data-error={!!errors.social_website}>
                        <Label htmlFor="website">Website</Label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                            <Globe size={16} />
                          </span>
                          <Input
                            id="website"
                            placeholder="https://example.com"
                            value={social.website}
                            onChange={(e) => handleSocialChange("website", e.target.value)}
                            className={`rounded-l-none ${errors.social_website ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                          />
                        </div>
                        {errors.social_website && <p className="text-red-500 text-xs mt-1">{errors.social_website}</p>}
                      </div>

                      <div data-error={!!errors.social_linkedin}>
                        <Label htmlFor="linkedin">LinkedIn</Label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
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
                              className="lucide lucide-linkedin"
                            >
                              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                              <rect width="4" height="12" x="2" y="9" />
                              <circle cx="4" cy="4" r="2" />
                            </svg>
                          </span>
                          <Input
                            id="linkedin"
                            placeholder="https://linkedin.com/in/username"
                            value={social.linkedin}
                            onChange={(e) => handleSocialChange("linkedin", e.target.value)}
                            className={`rounded-l-none ${errors.social_linkedin ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                          />
                        </div>
                        {errors.social_linkedin && (
                          <p className="text-red-500 text-xs mt-1">{errors.social_linkedin}</p>
                        )}
                      </div>

                      <div data-error={!!errors.social_twitter}>
                        <Label htmlFor="twitter">Twitter</Label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
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
                              className="lucide lucide-twitter"
                            >
                              <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                            </svg>
                          </span>
                          <Input
                            id="twitter"
                            placeholder="https://twitter.com/username"
                            value={social.twitter}
                            onChange={(e) => handleSocialChange("twitter", e.target.value)}
                            className={`rounded-l-none ${errors.social_twitter ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                          />
                        </div>
                        {errors.social_twitter && <p className="text-red-500 text-xs mt-1">{errors.social_twitter}</p>}
                      </div>

                      <div data-error={!!errors.social_facebook}>
                        <Label htmlFor="facebook">Facebook</Label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
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
                              className="lucide lucide-facebook"
                            >
                              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                            </svg>
                          </span>
                          <Input
                            id="facebook"
                            placeholder="https://facebook.com/username"
                            value={social.facebook}
                            onChange={(e) => handleSocialChange("facebook", e.target.value)}
                            className={`rounded-l-none ${errors.social_facebook ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                          />
                        </div>
                        {errors.social_facebook && (
                          <p className="text-red-500 text-xs mt-1">{errors.social_facebook}</p>
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {formSubmitted && Object.keys(errors).length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Please fix the validation errors before submitting the form.</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </>
  )
}
