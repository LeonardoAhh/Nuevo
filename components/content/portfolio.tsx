"use client"

import { useState, useEffect } from "react"
import { Edit, Eye, Filter, Grid, Info, List, MoreHorizontal, Plus, Trash2, X, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

// Enhanced sample data for portfolio items - 20 items
const initialPortfolioItems = [
  {
    id: 1,
    title: "E-commerce Website Redesign",
    type: "project",
    status: "completed",
    date: "2023-10-15",
    views: 1240,
    image: "/team-brainstorm.png",
    tags: ["UI/UX", "E-commerce", "Responsive"],
    content: "This project involved redesigning an e-commerce website to improve user experience and conversion rates.",
  },
  {
    id: 2,
    title: "Mobile App UI Design",
    type: "project",
    status: "in-progress",
    date: "2023-11-20",
    views: 890,
    image: "/modern-app-interface.png",
    tags: ["Mobile", "UI/UX", "App Design"],
    content: "Creating a modern and intuitive UI design for a mobile application focused on productivity.",
  },
  {
    id: 3,
    title: "10 UI Design Trends for 2024",
    type: "blog",
    status: "published",
    date: "2023-12-05",
    views: 3450,
    image: "/interconnected-design-landscape.png",
    tags: ["Design Trends", "UI/UX", "2024"],
    content: `# 10 UI Design Trends for 2024

## Introduction
As we move into 2024, UI design continues to evolve with new trends emerging. This blog post explores the top 10 UI design trends that will dominate the year.

## 1. Neumorphism Evolution
Neumorphism continues to evolve, with designers finding new ways to implement this soft UI style while addressing accessibility concerns.

## 2. Immersive 3D Elements
With improvements in browser capabilities, more websites are incorporating interactive 3D elements for a more immersive experience.

## 3. Micro-interactions 2.0
Micro-interactions are becoming more sophisticated, providing users with delightful feedback that enhances the overall experience.

## 4. Dark Mode Innovations
Dark mode is no longer just an alternative color scheme but a distinct design approach with its own principles and best practices.

## 5. Voice User Interfaces
As voice assistants become more prevalent, UI designs are adapting to complement voice interactions seamlessly.

## 6. Augmented Reality Integration
More websites and apps are incorporating AR features, requiring new UI patterns to guide users through these experiences.

## 7. Accessibility-First Design
Accessibility is moving from an afterthought to a primary consideration in the design process.

## 8. Data Visualization Evolution
With the growing importance of data, new and creative ways to visualize complex information are emerging.

## 9. Sustainable Digital Design
Designers are becoming more conscious of the environmental impact of digital products, leading to more efficient designs.

## 10. Customizable Interfaces
Allowing users to personalize their interfaces is becoming a key feature in many digital products.

## Conclusion
Staying updated with these trends will help designers create modern, user-friendly interfaces that meet the evolving expectations of users in 2024.`,
  },
  {
    id: 4,
    title: "How to Improve User Experience",
    type: "blog",
    status: "draft",
    date: "2024-01-10",
    views: 0,
    image: "/connected-experiences.png",
    tags: ["UX", "Best Practices", "Design"],
    content: `# How to Improve User Experience

## Understanding User Experience
User experience (UX) encompasses all aspects of the end-user's interaction with the company, its services, and its products.

## Key Principles for Better UX

### 1. Know Your Users
Conduct user research to understand your audience's needs, preferences, and pain points.

### 2. Create Consistent Experiences
Maintain consistency in design elements, interactions, and terminology across all touchpoints.

### 3. Prioritize Accessibility
Design for users of all abilities by following accessibility guidelines and best practices.

### 4. Optimize Performance
Ensure fast loading times and smooth interactions to prevent user frustration.

### 5. Simplify Navigation
Make it easy for users to find what they're looking for with intuitive navigation structures.

## Measuring UX Success
Implement analytics and gather user feedback to continuously improve your user experience.

## Conclusion
By focusing on these principles, you can create digital products that not only meet user needs but also provide enjoyable experiences that keep them coming back.`,
  },
  {
    id: 5,
    title: "Brand Identity for Tech Startup",
    type: "project",
    status: "completed",
    date: "2023-09-28",
    views: 1780,
    image: "/interconnected-brand-elements.png",
    tags: ["Branding", "Logo Design", "Identity"],
    content:
      "Developed a comprehensive brand identity for a tech startup, including logo design, color palette, typography, and brand guidelines.",
  },
  {
    id: 6,
    title: "The Future of Web Development",
    type: "blog",
    status: "published",
    date: "2023-11-15",
    views: 2890,
    image: "/coding-workspace.png",
    tags: ["Web Development", "Future Tech", "Trends"],
    content: `# The Future of Web Development

## Introduction
Web development is constantly evolving with new technologies, frameworks, and methodologies. This post explores the trends that will shape the future of web development.

## WebAssembly
WebAssembly (Wasm) is enabling high-performance applications in the browser, opening new possibilities for web applications that previously required native code.

## AI-Assisted Development
Artificial intelligence is increasingly being used to assist developers with code completion, bug detection, and even generating entire components.

## Edge Computing
Moving computation closer to the user with edge functions is reducing latency and improving user experience for web applications.

## Serverless Architecture
Serverless continues to gain popularity, allowing developers to focus on code rather than infrastructure management.

## Web Components
The adoption of web components is growing, enabling more modular and reusable code across different frameworks and libraries.

## Conclusion
Staying informed about these trends will help web developers prepare for the future and build better web applications.`,
  },
  {
    id: 7,
    title: "Financial Dashboard UI",
    type: "project",
    status: "completed",
    date: "2023-08-12",
    views: 2150,
    image: "/modern-app-interface.png",
    tags: ["Dashboard", "Finance", "Data Visualization"],
    content:
      "Designed a comprehensive financial dashboard with intuitive data visualization components for tracking investments, expenses, and financial goals.",
  },
  {
    id: 8,
    title: "Healthcare Mobile App",
    type: "project",
    status: "in-progress",
    date: "2023-12-18",
    views: 780,
    image: "/team-brainstorm.png",
    tags: ["Healthcare", "Mobile", "UX Research"],
    content:
      "Developing a patient-centered healthcare mobile application that simplifies appointment scheduling, medication tracking, and communication with healthcare providers.",
  },
  {
    id: 9,
    title: "Accessibility in Modern Web Design",
    type: "blog",
    status: "published",
    date: "2023-10-22",
    views: 1950,
    image: "/interconnected-design-landscape.png",
    tags: ["Accessibility", "Web Design", "Inclusive Design"],
    content:
      "An in-depth exploration of accessibility principles and practices in modern web design, including WCAG guidelines, assistive technologies, and inclusive design approaches.",
  },
  {
    id: 10,
    title: "Restaurant Ordering System",
    type: "project",
    status: "completed",
    date: "2023-07-05",
    views: 1320,
    image: "/connected-experiences.png",
    tags: ["Food Tech", "UX/UI", "Mobile"],
    content:
      "Designed and developed a streamlined ordering system for restaurants that integrates with kitchen management systems and provides real-time order tracking for customers.",
  },
  {
    id: 11,
    title: "The Psychology of Color in UI Design",
    type: "blog",
    status: "published",
    date: "2023-09-14",
    views: 3210,
    image: "/colorful-abstract-flow.png",
    tags: ["Color Theory", "Psychology", "UI Design"],
    content:
      "Exploring how color choices in user interfaces affect user perception, emotions, and behavior, with practical guidelines for effective color usage in digital products.",
  },
  {
    id: 12,
    title: "Smart Home Control Interface",
    type: "project",
    status: "in-progress",
    date: "2024-01-05",
    views: 650,
    image: "/interconnected-brand-elements.png",
    tags: ["IoT", "Smart Home", "Interface Design"],
    content:
      "Creating an intuitive and unified control interface for smart home devices, focusing on simplicity, accessibility, and seamless integration across multiple device ecosystems.",
  },
  {
    id: 13,
    title: "Minimalism vs. Maximalism in Web Design",
    type: "blog",
    status: "draft",
    date: "2024-01-18",
    views: 0,
    image: "/coding-workspace.png",
    tags: ["Web Design", "Design Theory", "Trends"],
    content:
      "Analyzing the contrasting approaches of minimalism and maximalism in web design, their appropriate applications, and how to effectively implement either style based on project requirements.",
  },
  {
    id: 14,
    title: "Travel Booking Platform Redesign",
    type: "project",
    status: "completed",
    date: "2023-11-02",
    views: 1870,
    image: "/diverse-group-chatting.png",
    tags: ["Travel", "Booking", "UX Redesign"],
    content:
      "Comprehensive redesign of a travel booking platform to simplify the booking process, improve search functionality, and enhance the overall user experience for travelers.",
  },
  {
    id: 15,
    title: "Effective Design Systems for Startups",
    type: "blog",
    status: "published",
    date: "2023-08-28",
    views: 2430,
    image: "/thoughtful-portrait.png",
    tags: ["Design Systems", "Startups", "Scalability"],
    content:
      "A practical guide to creating and implementing effective design systems for startups with limited resources, focusing on scalability, consistency, and development efficiency.",
  },
  {
    id: 16,
    title: "Fitness Tracking Wearable UI",
    type: "project",
    status: "in-progress",
    date: "2023-12-10",
    views: 920,
    image: "/diverse-group-city.png",
    tags: ["Wearables", "Fitness", "UI Design"],
    content:
      "Designing the user interface for a fitness tracking wearable device, focusing on glanceable information, meaningful metrics, and seamless integration with a companion mobile app.",
  },
  {
    id: 17,
    title: "The Rise of No-Code Development Platforms",
    type: "blog",
    status: "published",
    date: "2023-10-05",
    views: 1750,
    image: "/modern-app-interface.png",
    tags: ["No-Code", "Development", "Future Tech"],
    content:
      "Examining the growing popularity of no-code development platforms, their capabilities, limitations, and implications for professional developers and the future of software development.",
  },
  {
    id: 18,
    title: "Educational Platform for Children",
    type: "project",
    status: "completed",
    date: "2023-09-01",
    views: 2100,
    image: "/team-brainstorm.png",
    tags: ["Education", "Children", "Interactive Design"],
    content:
      "Designed an engaging and accessible educational platform for children aged 6-12, incorporating gamification elements, adaptive learning paths, and age-appropriate UI/UX considerations.",
  },
  {
    id: 19,
    title: "Sustainable Web Design Practices",
    type: "blog",
    status: "draft",
    date: "2024-01-15",
    views: 0,
    image: "/interconnected-design-landscape.png",
    tags: ["Sustainability", "Web Design", "Green UX"],
    content:
      "Exploring how web designers and developers can reduce the environmental impact of digital products through efficient coding, optimized assets, and thoughtful design decisions.",
  },
  {
    id: 20,
    title: "Cryptocurrency Exchange Dashboard",
    type: "project",
    status: "in-progress",
    date: "2023-12-22",
    views: 1050,
    image: "/connected-experiences.png",
    tags: ["Crypto", "Finance", "Dashboard"],
    content:
      "Developing a comprehensive cryptocurrency exchange dashboard with real-time data visualization, trading tools, and portfolio management features for both novice and experienced traders.",
  },
]

// Get all unique tags from portfolio items
const getAllTags = () => {
  const tagSet = new Set()
  initialPortfolioItems.forEach((item) => {
    if (item.tags) {
      item.tags.forEach((tag) => tagSet.add(tag))
    }
  })
  return Array.from(tagSet).sort()
}

export default function PortfolioContent() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedTab, setSelectedTab] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [currentPage, setCurrentPage] = useState(1)
  const [portfolioItems, setPortfolioItems] = useState(initialPortfolioItems)
  const [filteredItems, setFilteredItems] = useState(portfolioItems)
  const [paginatedItems, setPaginatedItems] = useState([])
  const [previewItem, setPreviewItem] = useState(null)
  const [deleteItem, setDeleteItem] = useState(null)
  const [showFilterPopover, setShowFilterPopover] = useState(false)
  const [filterOptions, setFilterOptions] = useState({
    status: [],
    tags: [],
    dateRange: {
      from: "",
      to: "",
    },
    minViews: "",
    searchTerm: "",
  })
  const [availableTags] = useState(getAllTags())
  const itemsPerPage = 9 // Changed from 6 to 9

  // Filter and sort items based on selected tab, sort option, and filter criteria
  useEffect(() => {
    let result = [...portfolioItems]

    // Apply type filter from tabs
    if (selectedTab !== "all") {
      result = result.filter((item) => item.type === selectedTab)
    }

    // Apply status filter
    if (filterOptions.status.length > 0) {
      result = result.filter((item) => filterOptions.status.includes(item.status))
    }

    // Apply tags filter
    if (filterOptions.tags.length > 0) {
      result = result.filter((item) => item.tags && item.tags.some((tag) => filterOptions.tags.includes(tag)))
    }

    // Apply date range filter
    if (filterOptions.dateRange.from) {
      const fromDate = new Date(filterOptions.dateRange.from)
      result = result.filter((item) => new Date(item.date) >= fromDate)
    }
    if (filterOptions.dateRange.to) {
      const toDate = new Date(filterOptions.dateRange.to)
      result = result.filter((item) => new Date(item.date) <= toDate)
    }

    // Apply minimum views filter
    if (filterOptions.minViews) {
      const minViews = Number.parseInt(filterOptions.minViews)
      if (!isNaN(minViews)) {
        result = result.filter((item) => item.views >= minViews)
      }
    }

    // Apply search term filter
    if (filterOptions.searchTerm) {
      const searchLower = filterOptions.searchTerm.toLowerCase()
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(searchLower) ||
          (item.content && item.content.toLowerCase().includes(searchLower)) ||
          (item.tags && item.tags.some((tag) => tag.toLowerCase().includes(searchLower))),
      )
    }

    // Apply sorting
    switch (sortBy) {
      case "newest":
        result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        break
      case "oldest":
        result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        break
      case "popular":
        result.sort((a, b) => b.views - a.views)
        break
      case "alphabetical":
        result.sort((a, b) => a.title.localeCompare(b.title))
        break
      default:
        break
    }

    setFilteredItems(result)
    setCurrentPage(1) // Reset to first page when filters change
  }, [selectedTab, sortBy, portfolioItems, filterOptions])

  // Apply pagination
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    setPaginatedItems(filteredItems.slice(startIndex, endIndex))
  }, [filteredItems, currentPage, itemsPerPage])

  // Calculate total pages
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)

  // Handle page change
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }

  // Handle edit button click
  const handleEdit = (item) => {
    if (item.type === "blog") {
      router.push(`/portfolio/create?id=${item.id}&type=blog`)
    } else {
      router.push(`/portfolio/create?id=${item.id}&type=project`)
    }
  }

  // Handle preview button click
  const handlePreview = (item) => {
    setPreviewItem(item)
  }

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (!deleteItem) return

    // Remove the item from the portfolio items
    const updatedItems = portfolioItems.filter((item) => item.id !== deleteItem.id)
    setPortfolioItems(updatedItems)

    // Reset the delete item
    setDeleteItem(null)

    // Show success message (in a real app, you might use a toast notification)
    console.log(`Deleted ${deleteItem.type}: ${deleteItem.title}`)
  }

  // Handle filter changes
  const handleFilterChange = (type, value) => {
    setFilterOptions((prev) => {
      if (type === "status") {
        // Toggle status selection
        const newStatus = prev.status.includes(value) ? prev.status.filter((s) => s !== value) : [...prev.status, value]
        return { ...prev, status: newStatus }
      } else if (type === "tag") {
        // Toggle tag selection
        const newTags = prev.tags.includes(value) ? prev.tags.filter((t) => t !== value) : [...prev.tags, value]
        return { ...prev, tags: newTags }
      } else if (type === "dateFrom") {
        return { ...prev, dateRange: { ...prev.dateRange, from: value } }
      } else if (type === "dateTo") {
        return { ...prev, dateRange: { ...prev.dateRange, to: value } }
      } else if (type === "minViews") {
        return { ...prev, minViews: value }
      } else if (type === "search") {
        return { ...prev, searchTerm: value }
      }
      return prev
    })
  }

  // Reset all filters
  const resetFilters = () => {
    setFilterOptions({
      status: [],
      tags: [],
      dateRange: {
        from: "",
        to: "",
      },
      minViews: "",
      searchTerm: "",
    })
    setShowFilterPopover(false)
  }

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 3

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages are less than or equal to max visible pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      // Show current page and adjacent pages
      if (currentPage > 2) {
        pages.push("...")
      }

      // Middle pages
      if (currentPage !== 1 && currentPage !== totalPages) {
        pages.push(currentPage)
      }

      // Show ellipsis if there are more pages
      if (currentPage < totalPages - 1) {
        pages.push("...")
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages)
      }
    }

    return pages
  }

  // Check if any filters are active
  const hasActiveFilters = () => {
    return (
      filterOptions.status.length > 0 ||
      filterOptions.tags.length > 0 ||
      filterOptions.dateRange.from !== "" ||
      filterOptions.dateRange.to !== "" ||
      filterOptions.minViews !== "" ||
      filterOptions.searchTerm !== ""
    )
  }

  // Simple markdown renderer component
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

      // Replace links
      html = html.replace(/\[([^\]]+)\]$([^)]+)$/gim, '<a href="$2" class="text-blue-500 hover:underline">$1</a>')

      // Replace lists
      html = html.replace(/^\s*\*\s(.*)/gim, '<li class="ml-6 list-disc">$1</li>')
      html = html.replace(/^\s*\d\.\s(.*)/gim, '<li class="ml-6 list-decimal">$1</li>')

      // Replace paragraphs
      html = html.replace(/^(?!<[hl]|<li)(.*$)/gim, '<p class="mb-4">$1</p>')

      return html
    }

    return <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }} />
  }

  return (
    <>
      <div className="flex justify-end mb-4 sm:mb-6 gap-2">
        <Popover open={showFilterPopover} onOpenChange={setShowFilterPopover}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`gap-2 text-xs sm:text-sm h-8 sm:h-10 ${hasActiveFilters() ? "border-orange-500 text-orange-500" : ""}`}
              >
                <Filter size={14} className="sm:size-16" />
                Filters{" "}
                {hasActiveFilters() && (
                  <Badge className="ml-1 bg-orange-500">
                    {filterOptions.status.length +
                      filterOptions.tags.length +
                      (filterOptions.dateRange.from ? 1 : 0) +
                      (filterOptions.dateRange.to ? 1 : 0) +
                      (filterOptions.minViews ? 1 : 0) +
                      (filterOptions.searchTerm ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 sm:w-96 p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Filter Portfolio Items</h3>
                  <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 text-xs">
                    Reset All
                  </Button>
                </div>

                {/* Search filter */}
                <div>
                  <Label htmlFor="search-filter" className="text-sm">
                    Search
                  </Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      id="search-filter"
                      placeholder="Search by title, content, or tags"
                      className="pl-8"
                      value={filterOptions.searchTerm}
                      onChange={(e) => handleFilterChange("search", e.target.value)}
                    />
                  </div>
                </div>

                <Separator />

                {/* Status filter */}
                <div>
                  <Label className="text-sm">Status</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {["completed", "in-progress", "published", "draft"].map((status) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${status}`}
                          checked={filterOptions.status.includes(status)}
                          onCheckedChange={() => handleFilterChange("status", status)}
                        />
                        <label htmlFor={`status-${status}`} className="text-sm capitalize cursor-pointer">
                          {status}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Date range filter */}
                <div>
                  <Label className="text-sm">Date Range</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <Label htmlFor="date-from" className="text-xs text-gray-500">
                        From
                      </Label>
                      <Input
                        id="date-from"
                        type="date"
                        value={filterOptions.dateRange.from}
                        onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="date-to" className="text-xs text-gray-500">
                        To
                      </Label>
                      <Input
                        id="date-to"
                        type="date"
                        value={filterOptions.dateRange.to}
                        onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Minimum views filter */}
                <div>
                  <Label htmlFor="min-views" className="text-sm">
                    Minimum Views
                  </Label>
                  <Input
                    id="min-views"
                    type="number"
                    placeholder="e.g. 1000"
                    value={filterOptions.minViews}
                    onChange={(e) => handleFilterChange("minViews", e.target.value)}
                    className="mt-1"
                  />
                </div>

                <Separator />

                {/* Tags filter */}
                <div>
                  <Label className="text-sm">Tags</Label>
                  <div className="mt-1 max-h-40 overflow-y-auto border rounded-md p-2">
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                      {availableTags.map((tag) => (
                        <div key={tag} className="flex items-center space-x-2">
                          <Checkbox
                            id={`tag-${tag}`}
                            checked={filterOptions.tags.includes(tag)}
                            onCheckedChange={() => handleFilterChange("tag", tag)}
                          />
                          <label htmlFor={`tag-${tag}`} className="text-sm truncate cursor-pointer" title={tag}>
                            {tag}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="outline" size="sm" onClick={() => setShowFilterPopover(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setShowFilterPopover(false)} className="bg-gray-900 hover:bg-black text-white">
                    Apply Filters
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button className="gap-2 bg-gray-900 hover:bg-black text-white text-xs sm:text-sm h-8 sm:h-10" asChild>
            <a href="/portfolio/create">
              <Plus size={14} className="sm:size-16" />
              Add Item
            </a>
          </Button>
        </div>
      </div>

      {/* Portfolio Tabs and View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
        <Tabs defaultValue="all" className="w-full sm:w-auto" onValueChange={setSelectedTab} value={selectedTab}>
          <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex">
            <TabsTrigger value="all" className="text-xs sm:text-sm">
              All Items ({portfolioItems.length})
            </TabsTrigger>
            <TabsTrigger value="project" className="text-xs sm:text-sm">
              Projects ({portfolioItems.filter((item) => item.type === "project").length})
            </TabsTrigger>
            <TabsTrigger value="blog" className="text-xs sm:text-sm">
              Blogs ({portfolioItems.filter((item) => item.type === "blog").length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px] sm:w-[180px] text-xs sm:text-sm h-8 sm:h-10">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="alphabetical">Alphabetical</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex border rounded-md overflow-hidden">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className={`h-8 sm:h-10 w-8 sm:w-10 ${viewMode === "grid" ? "bg-gray-900 text-white" : ""}`}
            >
              <Grid size={14} className="sm:size-16" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
              className={`h-8 sm:h-10 w-8 sm:w-10 ${viewMode === "list" ? "bg-gray-900 text-white" : ""}`}
            >
              <List size={14} className="sm:size-16" />
            </Button>
          </div>
        </div>
      </div>

      {/* Active filters display */}
      {hasActiveFilters() && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filterOptions.searchTerm && (
            <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
              Search: {filterOptions.searchTerm}
              <X size={14} className="ml-1 cursor-pointer" onClick={() => handleFilterChange("search", "")} />
            </Badge>
          )}

          {filterOptions.status.map((status) => (
            <Badge key={status} variant="secondary" className="flex items-center gap-1 px-2 py-1">
              Status: {status}
              <X size={14} className="ml-1 cursor-pointer" onClick={() => handleFilterChange("status", status)} />
            </Badge>
          ))}

          {filterOptions.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="flex items-center gap-1 px-2 py-1">
              Tag: {tag}
              <X size={14} className="ml-1 cursor-pointer" onClick={() => handleFilterChange("tag", tag)} />
            </Badge>
          ))}

          {filterOptions.dateRange.from && (
            <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
              From: {new Date(filterOptions.dateRange.from).toLocaleDateString()}
              <X size={14} className="ml-1 cursor-pointer" onClick={() => handleFilterChange("dateFrom", "")} />
            </Badge>
          )}

          {filterOptions.dateRange.to && (
            <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
              To: {new Date(filterOptions.dateRange.to).toLocaleDateString()}
              <X size={14} className="ml-1 cursor-pointer" onClick={() => handleFilterChange("dateTo", "")} />
            </Badge>
          )}

          {filterOptions.minViews && (
            <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
              Min Views: {filterOptions.minViews}
              <X size={14} className="ml-1 cursor-pointer" onClick={() => handleFilterChange("minViews", "")} />
            </Badge>
          )}

          <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs h-7 px-2 text-gray-500">
            Clear All
          </Button>
        </div>
      )}

      {/* Portfolio Items */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {paginatedItems.map((item) => (
            <Card key={item.id} className="overflow-hidden flex flex-col">
              <div className="relative h-32 sm:h-40 bg-gray-100">
                <img src={item.image || "/placeholder.svg"} alt={item.title} className="w-full h-full object-cover" />
                <Badge
                  className={`absolute top-2 right-2 ${
                    item.status === "completed" || item.status === "published"
                      ? "bg-green-100 text-green-800"
                      : item.status === "in-progress"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-orange-100 text-orange-800"
                  }`}
                >
                  {item.status === "completed"
                    ? "Completed"
                    : item.status === "in-progress"
                      ? "In Progress"
                      : item.status === "published"
                        ? "Published"
                        : "Draft"}
                </Badge>
              </div>
              <CardHeader className="pb-2 pt-3 px-3 sm:px-4 sm:pt-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base sm:text-lg line-clamp-1">{item.title}</CardTitle>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 -mr-2">
                          <MoreHorizontal size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>More options</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Badge variant="outline" className="w-fit capitalize mt-1">
                  {item.type}
                </Badge>
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {item.tags.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{item.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent className="pt-0 px-3 sm:px-4 flex-1 flex flex-col">
                <div className="flex flex-col sm:flex-row justify-between gap-2 text-xs sm:text-sm text-gray-500 mt-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5 text-gray-400"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                      <line x1="16" x2="16" y1="2" y2="6" />
                      <line x1="8" x2="8" y1="2" y2="6" />
                      <line x1="3" x2="21" y1="10" y2="10" />
                    </svg>
                    <span>
                      {new Date(item.date).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5 text-gray-400"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    <span>{item.views.toLocaleString()} views</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-auto pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs sm:text-sm h-8"
                    onClick={() => handleEdit(item)}
                  >
                    <Edit size={14} className="mr-1 hidden sm:inline" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-blue-500 hover:text-blue-600 text-xs sm:text-sm h-8"
                    onClick={() => handlePreview(item)}
                  >
                    <Eye size={14} className="mr-1 hidden sm:inline" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-red-500 hover:text-red-600 text-xs sm:text-sm h-8"
                    onClick={() => setDeleteItem(item)}
                  >
                    <Trash2 size={14} className="mr-1 hidden sm:inline" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // List view
        <div className="overflow-x-auto">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden sm:table-cell">Type</TableHead>
                    <TableHead className="hidden md:table-cell">Status</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="hidden lg:table-cell">Views</TableHead>
                    <TableHead className="hidden lg:table-cell">Tags</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <img
                          src={item.image || "/placeholder.svg"}
                          alt={item.title}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded object-cover"
                        />
                      </TableCell>
                      <TableCell className="font-medium max-w-[120px] sm:max-w-none">
                        <div className="truncate">{item.title}</div>
                        <div className="sm:hidden">
                          <Badge variant="outline" className="capitalize text-xs mt-1">
                            {item.type}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline" className="capitalize">
                          {item.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge
                          className={`
                      ${
                        item.status === "completed" || item.status === "published"
                          ? "bg-green-100 text-green-800"
                          : item.status === "in-progress"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-orange-100 text-orange-800"
                      }`}
                        >
                          {item.status === "completed"
                            ? "Completed"
                            : item.status === "in-progress"
                              ? "In Progress"
                              : item.status === "published"
                                ? "Published"
                                : "Draft"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{new Date(item.date).toLocaleDateString()}</TableCell>
                      <TableCell className="hidden lg:table-cell">{item.views.toLocaleString()}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {item.tags && (
                          <div className="flex flex-wrap gap-1">
                            {item.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {item.tags.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{item.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 sm:gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8 text-blue-500 hover:text-blue-600"
                            onClick={() => handlePreview(item)}
                          >
                            <Eye size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8 text-red-500 hover:text-red-600"
                            onClick={() => setDeleteItem(item)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {paginatedItems.length === 0 && (
        <div className="text-center py-12 border rounded-lg bg-white">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
            <Info className="text-gray-400" size={24} />
          </div>
          <h3 className="text-lg font-medium">No items found</h3>
          <p className="text-gray-500 mt-1">
            {hasActiveFilters()
              ? "No items match your current filters. Try adjusting your filter criteria."
              : selectedTab === "all"
                ? "You don't have any portfolio items yet. Create one to get started."
                : `You don't have any ${selectedTab}s yet.`}
          </p>
          {hasActiveFilters() ? (
            <Button className="mt-4" variant="outline" onClick={resetFilters}>
              Clear All Filters
            </Button>
          ) : (
            <Button className="mt-4" asChild>
              <a href="/portfolio/create">
                <Plus size={16} className="mr-2" />
                Add New {selectedTab === "blog" ? "Blog" : selectedTab === "project" ? "Project" : "Item"}
              </a>
            </Button>
          )}
        </div>
      )}

      {/* Pagination - Only show if items are more than itemsPerPage */}
      {filteredItems.length > itemsPerPage && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 sm:mt-6 gap-2 sm:gap-0">
          <div className="text-xs sm:text-sm text-gray-500 order-2 sm:order-1 text-center sm:text-left">
            Showing <span className="font-medium">{paginatedItems.length}</span> of{" "}
            <span className="font-medium">{filteredItems.length}</span> items
          </div>
          <div className="flex justify-center sm:justify-end gap-1 sm:gap-2 order-1 sm:order-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7 sm:h-8 px-2 sm:px-3"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>

            {getPageNumbers().map((page, index) =>
              page === "..." ? (
                <Button
                  key={`ellipsis-${index}`}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 sm:h-8 px-2 sm:px-3"
                  disabled
                >
                  ...
                </Button>
              ) : (
                <Button
                  key={`page-${page}`}
                  variant="outline"
                  size="sm"
                  className={`text-xs h-7 sm:h-8 px-2 sm:px-3 ${currentPage === page ? "bg-gray-900 text-white" : ""}`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Button>
              ),
            )}

            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7 sm:h-8 px-2 sm:px-3"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewItem} onOpenChange={(open) => !open && setPreviewItem(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{previewItem?.title}</DialogTitle>
            <DialogDescription>
              Published: {previewItem?.date} • {previewItem?.views.toLocaleString()} views
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {previewItem?.image && (
              <div className="mb-6">
                <img
                  src={previewItem.image || "/placeholder.svg"}
                  alt={previewItem.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
            )}
            {previewItem?.tags && previewItem.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {previewItem.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            <div className="prose max-w-none">
              <MarkdownPreview markdown={previewItem?.content} />
            </div>
          </div>
          <DialogFooter className="flex justify-end gap-2 mt-6">
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
            <Button onClick={() => handleEdit(previewItem)}>
              Edit {previewItem?.type === "blog" ? "Blog" : "Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this {deleteItem?.type}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>"{deleteItem?.title}"</strong> and remove it from your portfolio.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-500 hover:bg-red-600 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
