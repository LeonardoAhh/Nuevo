"use client"

import { useState, useEffect } from "react"
import {
  Archive,
  Copy,
  Edit,
  ExternalLink,
  Eye,
  Filter,
  Grid,
  List,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  Star,
  Tag,
  Trash2,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

// Sample data for products
const initialProducts = [
  {
    id: 1,
    title: "Admin Dashboard Template",
    type: "source-code",
    category: "web",
    price: 49.99,
    status: "published",
    featured: true,
    rating: 4.8,
    sales: 235,
    image: "/modern-app-interface.png",
    tags: ["React", "Tailwind CSS", "TypeScript"],
    description:
      "A fully responsive admin dashboard template built with React, Tailwind CSS, and TypeScript. Includes dark mode, multiple layouts, and 20+ UI components.",
    features: [
      "Responsive design",
      "Dark/light mode",
      "Multiple layouts",
      "20+ UI components",
      "Authentication pages",
      "Form validation",
      "Data tables",
      "Charts and graphs",
    ],
    demoUrl: "https://example.com/demo/admin-dashboard",
    lastUpdated: "2023-12-15",
  },
  {
    id: 2,
    title: "E-commerce Starter Kit",
    type: "source-code",
    category: "web",
    price: 79.99,
    status: "published",
    featured: false,
    rating: 4.6,
    sales: 187,
    image: "/interconnected-design-landscape.png",
    tags: ["Next.js", "Tailwind CSS", "Stripe", "TypeScript"],
    description:
      "A complete e-commerce starter kit with product listings, cart functionality, checkout with Stripe, and user authentication.",
    features: [
      "Product catalog",
      "Shopping cart",
      "Stripe checkout",
      "User authentication",
      "Order history",
      "Product search",
      "Responsive design",
      "SEO optimized",
    ],
    demoUrl: "https://example.com/demo/ecommerce",
    lastUpdated: "2023-11-20",
  },
  {
    id: 3,
    title: "Mobile App UI Kit",
    type: "design",
    category: "mobile",
    price: 39.99,
    status: "published",
    featured: true,
    rating: 4.9,
    sales: 312,
    image: "/connected-experiences.png",
    tags: ["Figma", "UI Kit", "Mobile"],
    description:
      "A comprehensive mobile app UI kit with 200+ components, 50+ screens, and 5 app examples. Perfect for designing modern mobile applications.",
    features: [
      "200+ components",
      "50+ pre-designed screens",
      "5 app examples",
      "Auto layout",
      "Responsive components",
      "Dark/light mode",
      "Well-organized layers",
      "Component variants",
    ],
    demoUrl: "https://example.com/demo/mobile-ui-kit",
    lastUpdated: "2023-10-05",
  },
  {
    id: 4,
    title: "Portfolio Website Template",
    type: "source-code",
    category: "web",
    price: 29.99,
    status: "draft",
    featured: false,
    rating: 4.5,
    sales: 156,
    image: "/team-brainstorm.png",
    tags: ["HTML", "CSS", "JavaScript", "Portfolio"],
    description:
      "A clean and modern portfolio website template for developers and designers. Easy to customize and deploy.",
    features: [
      "Responsive design",
      "Project showcase",
      "About section",
      "Skills display",
      "Contact form",
      "Blog section",
      "SEO optimized",
      "Fast loading",
    ],
    demoUrl: "https://example.com/demo/portfolio",
    lastUpdated: "2023-09-18",
  },
  {
    id: 5,
    title: "SaaS Landing Page",
    type: "source-code",
    category: "web",
    price: 34.99,
    status: "review",
    featured: false,
    rating: 4.7,
    sales: 203,
    image: "/colorful-abstract-flow.png",
    tags: ["HTML", "CSS", "JavaScript", "SaaS"],
    description:
      "A high-converting SaaS landing page template with pricing tables, feature sections, testimonials, and more.",
    features: [
      "Responsive design",
      "Pricing tables",
      "Feature sections",
      "Testimonials",
      "FAQ section",
      "Newsletter signup",
      "Contact form",
      "SEO optimized",
    ],
    demoUrl: "https://example.com/demo/saas-landing",
    lastUpdated: "2023-08-22",
  },
  {
    id: 6,
    title: "Dashboard UI Kit",
    type: "design",
    category: "web",
    price: 49.99,
    status: "published",
    featured: false,
    rating: 4.8,
    sales: 178,
    image: "/interconnected-brand-elements.png",
    tags: ["Figma", "UI Kit", "Dashboard"],
    description:
      "A comprehensive dashboard UI kit with 300+ components, 30+ templates, and 10 example pages. Perfect for designing admin panels and dashboards.",
    features: [
      "300+ components",
      "30+ templates",
      "10 example pages",
      "Auto layout",
      "Responsive components",
      "Dark/light mode",
      "Well-organized layers",
      "Component variants",
    ],
    demoUrl: "https://example.com/demo/dashboard-ui-kit",
    lastUpdated: "2023-07-15",
  },
  {
    id: 7,
    title: "React Native Food Delivery App",
    type: "source-code",
    category: "mobile",
    price: 89.99,
    status: "published",
    featured: true,
    rating: 4.6,
    sales: 142,
    image: "/diverse-group-chatting.png",
    tags: ["React Native", "Expo", "Firebase", "Mobile"],
    description:
      "A complete food delivery app built with React Native and Firebase. Includes user authentication, restaurant listings, cart functionality, and order tracking.",
    features: [
      "User authentication",
      "Restaurant listings",
      "Menu browsing",
      "Cart functionality",
      "Order tracking",
      "Payment integration",
      "Push notifications",
      "User reviews",
    ],
    demoUrl: "https://example.com/demo/food-delivery",
    lastUpdated: "2023-11-05",
  },
  {
    id: 8,
    title: "Social Media UI Kit",
    type: "design",
    category: "mobile",
    price: 44.99,
    status: "published",
    featured: false,
    rating: 4.7,
    sales: 198,
    image: "/diverse-group-city.png",
    tags: ["Figma", "UI Kit", "Social Media"],
    description:
      "A modern social media UI kit with 250+ components and 40+ screens. Perfect for designing social networking apps and platforms.",
    features: [
      "250+ components",
      "40+ screens",
      "Profile layouts",
      "Feed designs",
      "Story components",
      "Messaging interfaces",
      "Dark/light mode",
      "Well-organized layers",
    ],
    demoUrl: "https://example.com/demo/social-ui-kit",
    lastUpdated: "2023-10-12",
  },
  {
    id: 9,
    title: "Blog Website Template",
    type: "source-code",
    category: "web",
    price: 29.99,
    status: "draft",
    featured: false,
    rating: 4.5,
    sales: 167,
    image: "/thoughtful-portrait.png",
    tags: ["HTML", "CSS", "JavaScript", "Blog"],
    description:
      "A clean and modern blog website template with multiple layouts, category pages, and a responsive design.",
    features: [
      "Responsive design",
      "Multiple layouts",
      "Category pages",
      "Search functionality",
      "Related posts",
      "Newsletter signup",
      "Comment system",
      "SEO optimized",
    ],
    demoUrl: "https://example.com/demo/blog-template",
    lastUpdated: "2023-09-08",
  },
  {
    id: 10,
    title: "E-learning Platform",
    type: "source-code",
    category: "web",
    price: 99.99,
    status: "review",
    featured: false,
    rating: 4.8,
    sales: 124,
    image: "/coding-workspace.png",
    tags: ["React", "Node.js", "MongoDB", "Express"],
    description:
      "A complete e-learning platform with course creation, student enrollment, video lessons, quizzes, and progress tracking.",
    features: [
      "Course creation",
      "Student enrollment",
      "Video lessons",
      "Quizzes and assessments",
      "Progress tracking",
      "Discussion forums",
      "Certificate generation",
      "Payment integration",
    ],
    demoUrl: "https://example.com/demo/elearning",
    lastUpdated: "2023-12-01",
  },
  {
    id: 11,
    title: "Real Estate Website Template",
    type: "source-code",
    category: "web",
    price: 59.99,
    status: "published",
    featured: false,
    rating: 4.6,
    sales: 138,
    image: "/interconnected-design-landscape.png",
    tags: ["HTML", "CSS", "JavaScript", "Real Estate"],
    description:
      "A modern real estate website template with property listings, search filters, agent profiles, and contact forms.",
    features: [
      "Property listings",
      "Search filters",
      "Agent profiles",
      "Property details",
      "Image galleries",
      "Google Maps integration",
      "Contact forms",
      "Responsive design",
    ],
    demoUrl: "https://example.com/demo/real-estate",
    lastUpdated: "2023-08-15",
  },
  {
    id: 12,
    title: "Finance App UI Kit",
    type: "design",
    category: "mobile",
    price: 54.99,
    status: "archived",
    featured: false,
    rating: 4.9,
    sales: 215,
    image: "/modern-app-interface.png",
    tags: ["Figma", "UI Kit", "Finance"],
    description:
      "A comprehensive finance app UI kit with 200+ components and 30+ screens. Perfect for designing banking, investment, and financial apps.",
    features: [
      "200+ components",
      "30+ screens",
      "Dashboard layouts",
      "Transaction history",
      "Analytics screens",
      "Payment interfaces",
      "Dark/light mode",
      "Well-organized layers",
    ],
    demoUrl: "https://example.com/demo/finance-ui-kit",
    lastUpdated: "2023-11-18",
  },
]

// Get all unique tags from products
const getAllTags = () => {
  const tagSet = new Set()
  initialProducts.forEach((product) => {
    if (product.tags) {
      product.tags.forEach((tag) => tagSet.add(tag))
    }
  })
  return Array.from(tagSet).sort()
}

// Get all unique categories from products
const getAllCategories = () => {
  const categorySet = new Set()
  initialProducts.forEach((product) => {
    if (product.category) {
      categorySet.add(product.category)
    }
  })
  return Array.from(categorySet).sort()
}

export default function ProductsContent() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedTab, setSelectedTab] = useState("all")
  const [sortBy, setSortBy] = useState("popular")
  const [currentPage, setCurrentPage] = useState(1)
  const [products, setProducts] = useState(initialProducts)
  const [filteredProducts, setFilteredProducts] = useState(products)
  const [paginatedProducts, setPaginatedProducts] = useState([])
  const [productDetail, setProductDetail] = useState(null)
  const [showFilterPopover, setShowFilterPopover] = useState(false)
  const [filterOptions, setFilterOptions] = useState({
    priceRange: {
      min: "",
      max: "",
    },
    categories: [],
    tags: [],
    status: [],
    featured: null,
    rating: "",
    searchTerm: "",
  })
  const [availableTags] = useState(getAllTags())
  const [availableCategories] = useState(getAllCategories())
  const itemsPerPage = 9

  // Filter and sort products based on selected tab, sort option, and filter criteria
  useEffect(() => {
    let result = [...products]

    // Apply type filter from tabs
    if (selectedTab !== "all") {
      result = result.filter((product) => product.type === selectedTab)
    }

    // Apply price range filter
    if (filterOptions.priceRange.min) {
      const minPrice = Number.parseFloat(filterOptions.priceRange.min)
      if (!isNaN(minPrice)) {
        result = result.filter((product) => {
          const effectivePrice = product.discountPrice || product.price
          return effectivePrice >= minPrice
        })
      }
    }
    if (filterOptions.priceRange.max) {
      const maxPrice = Number.parseFloat(filterOptions.priceRange.max)
      if (!isNaN(maxPrice)) {
        result = result.filter((product) => {
          const effectivePrice = product.discountPrice || product.price
          return effectivePrice <= maxPrice
        })
      }
    }

    // Apply category filter
    if (filterOptions.categories.length > 0) {
      result = result.filter((product) => filterOptions.categories.includes(product.category))
    }

    // Apply tags filter
    if (filterOptions.tags.length > 0) {
      result = result.filter((product) => product.tags && product.tags.some((tag) => filterOptions.tags.includes(tag)))
    }

    // Apply status filter
    if (filterOptions.status.length > 0) {
      result = result.filter((product) => filterOptions.status.includes(product.status))
    }

    // Apply featured filter
    if (filterOptions.featured !== null) {
      result = result.filter((product) => product.featured === filterOptions.featured)
    }

    // Apply rating filter
    if (filterOptions.rating) {
      const minRating = Number.parseFloat(filterOptions.rating)
      if (!isNaN(minRating)) {
        result = result.filter((product) => product.rating >= minRating)
      }
    }

    // Apply search term filter
    if (filterOptions.searchTerm) {
      const searchLower = filterOptions.searchTerm.toLowerCase()
      result = result.filter(
        (product) =>
          product.title.toLowerCase().includes(searchLower) ||
          (product.description && product.description.toLowerCase().includes(searchLower)) ||
          (product.tags && product.tags.some((tag) => tag.toLowerCase().includes(searchLower))),
      )
    }

    // Apply sorting
    switch (sortBy) {
      case "popular":
        result.sort((a, b) => b.sales - a.sales)
        break
      case "newest":
        result.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
        break
      case "price-low":
        result.sort((a, b) => {
          const priceA = a.discountPrice !== null ? a.discountPrice : a.price
          const priceB = b.discountPrice !== null ? b.discountPrice : b.price
          return priceA - priceB
        })
        break
      case "price-high":
        result.sort((a, b) => {
          const priceA = a.discountPrice !== null ? a.discountPrice : a.price
          const priceB = b.discountPrice !== null ? b.discountPrice : b.price
          return priceB - priceA
        })
        break
      case "rating":
        result.sort((a, b) => b.rating - a.rating)
        break
      default:
        break
    }

    setFilteredProducts(result)
    setCurrentPage(1) // Reset to first page when filters change
  }, [selectedTab, sortBy, products, filterOptions])

  // Apply pagination
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    setPaginatedProducts(filteredProducts.slice(startIndex, endIndex))
  }, [filteredProducts, currentPage, itemsPerPage])

  // Calculate total pages
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)

  // Handle page change
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return
    setCurrentPage(page)
  }

  // Handle filter changes
  const handleFilterChange = (type, value) => {
    setFilterOptions((prev) => {
      if (type === "category") {
        // Toggle category selection
        const newCategories = prev.categories.includes(value)
          ? prev.categories.filter((c) => c !== value)
          : [...prev.categories, value]
        return { ...prev, categories: newCategories }
      } else if (type === "tag") {
        // Toggle tag selection
        const newTags = prev.tags.includes(value) ? prev.tags.filter((t) => t !== value) : [...prev.tags, value]
        return { ...prev, tags: newTags }
      } else if (type === "status") {
        // Toggle status selection
        const newStatus = prev.status.includes(value) ? prev.status.filter((s) => s !== value) : [...prev.status, value]
        return { ...prev, status: newStatus }
      } else if (type === "featured") {
        // Set featured filter (true, false, or null)
        return { ...prev, featured: prev.featured === value ? null : value }
      } else if (type === "minPrice") {
        return { ...prev, priceRange: { ...prev.priceRange, min: value } }
      } else if (type === "maxPrice") {
        return { ...prev, priceRange: { ...prev.priceRange, max: value } }
      } else if (type === "rating") {
        return { ...prev, rating: value }
      } else if (type === "search") {
        return { ...prev, searchTerm: value }
      }
      return prev
    })
  }

  // Reset all filters
  const resetFilters = () => {
    setFilterOptions({
      priceRange: {
        min: "",
        max: "",
      },
      categories: [],
      tags: [],
      status: [],
      featured: null,
      rating: "",
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
      filterOptions.priceRange.min !== "" ||
      filterOptions.priceRange.max !== "" ||
      filterOptions.categories.length > 0 ||
      filterOptions.tags.length > 0 ||
      filterOptions.status.length > 0 ||
      filterOptions.featured !== null ||
      filterOptions.rating !== "" ||
      filterOptions.searchTerm !== ""
    )
  }

  // Format price with currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price)
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Product Management</h1>
          <p className="text-gray-500 text-sm sm:text-base">Manage your digital products and assets</p>
        </div>
        <div className="flex gap-2">
          <Button className="gap-2 bg-gray-900 hover:bg-black text-white text-xs sm:text-sm h-8 sm:h-10">
            <Plus size={14} className="sm:size-16" />
            Add Product
          </Button>
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
                    {filterOptions.categories.length +
                      filterOptions.tags.length +
                      filterOptions.status.length +
                      (filterOptions.featured !== null ? 1 : 0) +
                      (filterOptions.priceRange.min ? 1 : 0) +
                      (filterOptions.priceRange.max ? 1 : 0) +
                      (filterOptions.rating ? 1 : 0) +
                      (filterOptions.searchTerm ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 sm:w-96 p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Filter Products</h3>
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
                      placeholder="Search by title, description, or tags"
                      className="pl-8"
                      value={filterOptions.searchTerm}
                      onChange={(e) => handleFilterChange("search", e.target.value)}
                    />
                  </div>
                </div>

                <Separator />

                {/* Price range filter */}
                <div>
                  <Label className="text-sm">Price Range</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <Label htmlFor="min-price" className="text-xs text-gray-500">
                        Min Price
                      </Label>
                      <Input
                        id="min-price"
                        type="number"
                        placeholder="Min"
                        value={filterOptions.priceRange.min}
                        onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="max-price" className="text-xs text-gray-500">
                        Max Price
                      </Label>
                      <Input
                        id="max-price"
                        type="number"
                        placeholder="Max"
                        value={filterOptions.priceRange.max}
                        onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Rating filter */}
                <div>
                  <Label htmlFor="rating" className="text-sm">
                    Minimum Rating
                  </Label>
                  <Select value={filterOptions.rating} onValueChange={(value) => handleFilterChange("rating", value)}>
                    <SelectTrigger id="rating" className="mt-1">
                      <SelectValue placeholder="Select minimum rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any Rating</SelectItem>
                      <SelectItem value="4.5">4.5 & Up</SelectItem>
                      <SelectItem value="4">4.0 & Up</SelectItem>
                      <SelectItem value="3.5">3.5 & Up</SelectItem>
                      <SelectItem value="3">3.0 & Up</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Status filter */}
                <div>
                  <Label className="text-sm">Status</Label>
                  <div className="mt-1 space-y-1">
                    {["published", "draft", "review", "archived"].map((status) => (
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

                <Separator />

                {/* Featured filter */}
                <div>
                  <Label className="text-sm">Featured</Label>
                  <div className="mt-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="featured-yes"
                        checked={filterOptions.featured === true}
                        onCheckedChange={() => handleFilterChange("featured", true)}
                      />
                      <label htmlFor="featured-yes" className="text-sm cursor-pointer">
                        Featured only
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="featured-no"
                        checked={filterOptions.featured === false}
                        onCheckedChange={() => handleFilterChange("featured", false)}
                      />
                      <label htmlFor="featured-no" className="text-sm cursor-pointer">
                        Non-featured only
                      </label>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Categories filter */}
                <div>
                  <Label className="text-sm">Categories</Label>
                  <div className="mt-1 space-y-1">
                    {availableCategories.map((category) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={`category-${category}`}
                          checked={filterOptions.categories.includes(category)}
                          onCheckedChange={() => handleFilterChange("category", category)}
                        />
                        <label htmlFor={`category-${category}`} className="text-sm capitalize cursor-pointer">
                          {category}
                        </label>
                      </div>
                    ))}
                  </div>
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
        </div>
      </div>

      {/* Products Tabs and View Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
        <Tabs defaultValue="all" className="w-full sm:w-auto" onValueChange={setSelectedTab} value={selectedTab}>
          <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex">
            <TabsTrigger value="all" className="text-xs sm:text-sm">
              All Products ({products.length})
            </TabsTrigger>
            <TabsTrigger value="source-code" className="text-xs sm:text-sm">
              Source Code ({products.filter((product) => product.type === "source-code").length})
            </TabsTrigger>
            <TabsTrigger value="design" className="text-xs sm:text-sm">
              Design Assets ({products.filter((product) => product.type === "design").length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px] sm:w-[180px] text-xs sm:text-sm h-8 sm:h-10">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
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

          {filterOptions.priceRange.min && (
            <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
              Min Price: ${filterOptions.priceRange.min}
              <X size={14} className="ml-1 cursor-pointer" onClick={() => handleFilterChange("minPrice", "")} />
            </Badge>
          )}

          {filterOptions.priceRange.max && (
            <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
              Max Price: ${filterOptions.priceRange.max}
              <X size={14} className="ml-1 cursor-pointer" onClick={() => handleFilterChange("maxPrice", "")} />
            </Badge>
          )}

          {filterOptions.rating && (
            <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
              Rating: {filterOptions.rating}+ Stars
              <X size={14} className="ml-1 cursor-pointer" onClick={() => handleFilterChange("rating", "")} />
            </Badge>
          )}

          {filterOptions.categories.map((category) => (
            <Badge key={category} variant="secondary" className="flex items-center gap-1 px-2 py-1">
              Category: {category}
              <X size={14} className="ml-1 cursor-pointer" onClick={() => handleFilterChange("category", category)} />
            </Badge>
          ))}

          {filterOptions.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="flex items-center gap-1 px-2 py-1">
              Tag: {tag}
              <X size={14} className="ml-1 cursor-pointer" onClick={() => handleFilterChange("tag", tag)} />
            </Badge>
          ))}

          {filterOptions.status.map((status) => (
            <Badge key={status} variant="secondary" className="flex items-center gap-1 px-2 py-1">
              Status: {status}
              <X size={14} className="ml-1 cursor-pointer" onClick={() => handleFilterChange("status", status)} />
            </Badge>
          ))}

          {filterOptions.featured !== null && (
            <Badge variant="secondary" className="flex items-center gap-1 px-2 py-1">
              {filterOptions.featured ? "Featured only" : "Non-featured only"}
              <X
                size={14}
                className="ml-1 cursor-pointer"
                onClick={() => handleFilterChange("featured", filterOptions.featured)}
              />
            </Badge>
          )}

          <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs h-7 px-2 text-gray-500">
            Clear All
          </Button>
        </div>
      )}

      {/* Products Grid View */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {paginatedProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden flex flex-col h-full">
              <div className="relative h-48 bg-gray-100">
                <img
                  src={product.image || "/placeholder.svg"}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  <Badge
                    className={`${
                      product.type === "source-code" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    {product.type === "source-code" ? "Source Code" : "Design Asset"}
                  </Badge>
                  <Badge
                    className={`${
                      product.status === "published"
                        ? "bg-green-100 text-green-800"
                        : product.status === "draft"
                          ? "bg-gray-100 text-gray-800"
                          : product.status === "review"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                    }`}
                  >
                    {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                  </Badge>
                </div>
                {product.featured && (
                  <Badge className="absolute top-2 right-2 bg-orange-500 text-white">Featured</Badge>
                )}
              </div>
              <CardHeader className="pb-2 pt-3 px-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base sm:text-lg line-clamp-1">{product.title}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="mr-2 h-4 w-4" /> Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" /> Preview
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Tag className="mr-2 h-4 w-4" /> Manage Tags
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        {product.featured ? (
                          <>
                            <Star className="mr-2 h-4 w-4" /> Remove Featured
                          </>
                        ) : (
                          <>
                            <Star className="mr-2 h-4 w-4" /> Mark as Featured
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Archive className="mr-2 h-4 w-4" /> Archive
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{product.rating}</span>
                  <span className="text-xs text-gray-500">({product.sales} sales)</span>
                </div>
              </CardHeader>
              <CardContent className="pt-0 px-4 flex-1">
                <div className="flex flex-wrap gap-1 mb-2">
                  {product.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {product.tags.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{product.tags.length - 3}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{product.description}</p>
              </CardContent>
              <CardFooter className="flex flex-col gap-3 pt-0 px-4 pb-4">
                <div className="flex items-center justify-between w-full">
                  <div className="text-lg font-bold">${product.price.toFixed(2)}</div>
                  <div className="text-xs text-gray-500">
                    Updated: {new Date(product.lastUpdated).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-2 w-full">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit size={14} className="mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye size={14} className="mr-1" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-red-500 hover:text-red-600 hover:border-red-200"
                  >
                    <Trash2 size={14} className="mr-1" />
                    Delete
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        // List view
        <div className="space-y-4">
          {paginatedProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                <div className="relative w-full sm:w-48 h-48 sm:h-auto bg-gray-100">
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    <Badge
                      className={`${
                        product.type === "source-code" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {product.type === "source-code" ? "Source Code" : "Design Asset"}
                    </Badge>
                    <Badge
                      className={`${
                        product.status === "published"
                          ? "bg-green-100 text-green-800"
                          : product.status === "draft"
                            ? "bg-gray-100 text-gray-800"
                            : product.status === "review"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                      }`}
                    >
                      {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                    </Badge>
                  </div>
                  {product.featured && (
                    <Badge className="absolute top-2 right-2 bg-orange-500 text-white">Featured</Badge>
                  )}
                </div>
                <div className="flex-1 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-semibold">{product.title}</h3>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{product.rating}</span>
                        <span className="text-xs text-gray-500">({product.sales} sales)</span>
                      </div>
                    </div>
                    <div className="text-lg font-bold">${product.price.toFixed(2)}</div>
                  </div>

                  <div className="flex flex-wrap gap-1 my-2">
                    {product.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{product.description}</p>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2">
                    <div className="text-xs text-gray-500">
                      Updated: {new Date(product.lastUpdated).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit size={14} className="mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye size={14} className="mr-1" />
                        Preview
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreHorizontal size={14} className="mr-1" />
                            More
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Copy className="mr-2 h-4 w-4" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <ExternalLink className="mr-2 h-4 w-4" /> View Demo
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Tag className="mr-2 h-4 w-4" /> Manage Tags
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            {product.featured ? (
                              <>
                                <Star className="mr-2 h-4 w-4" /> Remove Featured
                              </>
                            ) : (
                              <>
                                <Star className="mr-2 h-4 w-4" /> Mark as Featured
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Archive className="mr-2 h-4 w-4" /> Archive
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {paginatedProducts.length === 0 && (
        <div className="text-center py-12 border rounded-lg bg-white">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
            <Package className="text-gray-400" size={24} />
          </div>
          <h3 className="text-lg font-medium">No products found</h3>
          <p className="text-gray-500 mt-1">
            {hasActiveFilters()
              ? "No products match your current filters. Try adjusting your filter criteria."
              : selectedTab === "all"
                ? "There are no products available at the moment."
                : `There are no ${selectedTab === "source-code" ? "source code" : "design assets"} available at the moment.`}
          </p>
          {hasActiveFilters() && (
            <Button className="mt-4" variant="outline" onClick={resetFilters}>
              Clear All Filters
            </Button>
          )}
        </div>
      )}

      {/* Pagination - Only show if items are more than itemsPerPage */}
      {filteredProducts.length > itemsPerPage && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-6 gap-2 sm:gap-0">
          <div className="text-xs sm:text-sm text-gray-500 order-2 sm:order-1 text-center sm:text-left">
            Showing <span className="font-medium">{paginatedProducts.length}</span> of{" "}
            <span className="font-medium">{filteredProducts.length}</span> products
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

      {/* Product Detail Dialog */}
      <Dialog open={!!productDetail} onOpenChange={(open) => !open && setProductDetail(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {productDetail && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{productDetail.title}</DialogTitle>
                <DialogDescription>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      className={
                        productDetail.type === "source-code"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-purple-100 text-purple-800"
                      }
                    >
                      {productDetail.type === "source-code" ? "Source Code" : "Design Asset"}
                    </Badge>
                    <Badge
                      className={`${
                        productDetail.status === "published"
                          ? "bg-green-100 text-green-800"
                          : productDetail.status === "draft"
                            ? "bg-gray-100 text-gray-800"
                            : productDetail.status === "review"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                      }`}
                    >
                      {productDetail.status.charAt(0).toUpperCase() + productDetail.status.slice(1)}
                    </Badge>
                    {productDetail.featured && <Badge className="bg-orange-500 text-white">Featured</Badge>}
                    <span>•</span>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                      <span className="font-medium">{productDetail.rating}</span>
                    </div>
                    <span>•</span>
                    <span className="text-sm">{productDetail.sales} sales</span>
                  </div>
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <div className="rounded-lg overflow-hidden border">
                    <img
                      src={productDetail.image || "/placeholder.svg"}
                      alt={productDetail.title}
                      className="w-full h-64 object-cover"
                    />
                  </div>

                  <div className="mt-4">
                    <h3 className="font-medium mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {productDetail.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-medium">Price</h3>
                      <div className="flex items-end gap-2 mt-1">
                        <span className="text-2xl font-bold">${productDetail.price.toFixed(2)}</span>
                      </div>
                    </div>
                    <Select defaultValue={productDetail.status}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="review">In Review</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator className="my-4" />

                  <div className="mb-4">
                    <h3 className="font-medium mb-2">Description</h3>
                    <p className="text-gray-700">{productDetail.description}</p>
                  </div>

                  <div className="mb-4">
                    <h3 className="font-medium mb-2">Features</h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                      {productDetail.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-green-500"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Separator className="my-4" />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-medium">Last Updated</h3>
                      <p className="text-sm text-gray-500">
                        {new Date(productDetail.lastUpdated).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <Button variant="outline" className="gap-2">
                      <ExternalLink size={16} />
                      View Demo
                    </Button>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex justify-end gap-2 mt-6">
                <DialogClose asChild>
                  <Button variant="outline">Close</Button>
                </DialogClose>
                <Button variant="outline">
                  <Copy size={16} className="mr-2" />
                  Duplicate
                </Button>
                <Button>
                  <Edit size={16} className="mr-2" />
                  Edit Product
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-500 hover:bg-red-600 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
