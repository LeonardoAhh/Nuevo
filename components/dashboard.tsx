"use client"

import { useState, useEffect, type ReactNode } from "react"
import {
  Car,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Info,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  UserPlus,
  Plus,
  Search,
  Settings,
  Filter,
  Moon,
  Sun,
  X,
  Menu,
  MoreHorizontal,
  Package,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { useTheme } from "@/components/theme-context"
import { useUser, useProfile } from "@/lib/hooks"

// Custom scrollbar styles
const scrollbarStyles = `
  .scrollbar-thin {
    scrollbar-width: thin;
  }
  
  .scrollbar-thin::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  .scrollbar-thin::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .scrollbar-thin::-webkit-scrollbar-thumb {
    background-color: rgba(156, 163, 175, 0.5);
    border-radius: 20px;
  }
  
  .scrollbar-thin::-webkit-scrollbar-thumb:hover {
    background-color: rgba(156, 163, 175, 0.7);
  }
  
  .dark .scrollbar-thin::-webkit-scrollbar-thumb {
    background-color: rgba(75, 85, 99, 0.5);
  }
  
  .dark .scrollbar-thin::-webkit-scrollbar-thumb:hover {
    background-color: rgba(75, 85, 99, 0.7);
  }
`

interface DashboardProps {
  content?: ReactNode
  pageTitle?: string
}

export default function Dashboard({ content, pageTitle }: DashboardProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [currentPath, setCurrentPath] = useState("")
  const { theme, toggleTheme } = useTheme()
  const { user } = useUser()
  const { profile } = useProfile(user?.id)

  const displayTitle = pageTitle ?? (!content ? "Dashboard" : undefined)

  // Add state variables for mobile sidebar at the top of the component
  const [isMobileView, setIsMobileView] = useState(false)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const showExpandedSidebar = isMobileView || !sidebarCollapsed

  useEffect(() => {
    const persisted = localStorage.getItem("sidebarCollapsed") === "true"
    setSidebarCollapsed(persisted)
  }, [])

  // Add a useEffect to set the path after component mounts
  useEffect(() => {
    setCurrentPath(window.location.pathname)
  }, [])

  // Persist sidebar collapsed state
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", String(sidebarCollapsed))
  }, [sidebarCollapsed])

  // Add useEffect to detect mobile view
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768)
    }

    checkMobileView()
    window.addEventListener("resize", checkMobileView)

    return () => {
      window.removeEventListener("resize", checkMobileView)
    }
  }, [])

  // Add custom scrollbar styles
  useEffect(() => {
    const styleElement = document.createElement("style")
    styleElement.textContent = scrollbarStyles
    document.head.appendChild(styleElement)

    return () => {
      document.head.removeChild(styleElement)
    }
  }, [])

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div
        className={`bg-white dark:bg-gray-800 border-r dark:border-gray-700 ${isMobileView ? "w-64" : sidebarCollapsed ? "w-20" : "w-64"} transition-all duration-300 flex flex-col ${isMobileView ? "fixed z-50 h-screen shadow-lg" : ""} ${isMobileView && !showMobileSidebar ? "-translate-x-full" : ""}`}
      >
        <div className="p-2 min-h-[50px] border-b dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {showExpandedSidebar && (
              <>
                <div className="bg-primary text-primary-foreground p-2 rounded">
                  <Car size={16} />
                </div>
                <div>
                  <div className="font-semibold dark:text-white">VIÑOPLASTIC</div>
                </div>
              </>
            )}
            {!showExpandedSidebar && (
              <div className="bg-primary text-primary-foreground p-2 rounded mx-auto">
                <Car size={16} />
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => (isMobileView ? setShowMobileSidebar(false) : setSidebarCollapsed(!sidebarCollapsed))}
          >
            {isMobileView ? <X size={16} /> : sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </Button>
        </div>

        <div className="flex-1 overflow-auto scrollbar-thin">
          <div className="space-y-1 p-2">
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start ${showExpandedSidebar ? "" : "px-2"} ${currentPath === "/" ? "border-l-4 border-primary bg-primary/10" : ""}`}
                    asChild
                  >
                    <a href="/">
                      <LayoutDashboard size={18} className={`${showExpandedSidebar ? "mr-2" : "mx-auto"}`} />
                      {showExpandedSidebar && <span>Dashboard</span>}
                    </a>
                  </Button>
                </TooltipTrigger>
                {!showExpandedSidebar && <TooltipContent side="right">Dashboard</TooltipContent>}
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start ${showExpandedSidebar ? "" : "px-2"} ${currentPath === "/capacitacion" ? "border-l-4 border-primary bg-primary/10" : ""}`}
                    asChild
                  >
                    <a href="/capacitacion">
                      <GraduationCap size={18} className={`${showExpandedSidebar ? "mr-2" : "mx-auto"}`} />
                      {showExpandedSidebar && <span>Capacitación</span>}
                    </a>
                  </Button>
                </TooltipTrigger>
                {!showExpandedSidebar && <TooltipContent side="right">Capacitación</TooltipContent>}
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start ${showExpandedSidebar ? "" : "px-2"} ${currentPath === "/nuevo-ingreso" ? "border-l-4 border-primary bg-primary/10" : ""}`}
                    asChild
                  >
                    <a href="/nuevo-ingreso">
                      <UserPlus size={18} className={`${showExpandedSidebar ? "mr-2" : "mx-auto"}`} />
                      {showExpandedSidebar && <span>Nuevo Ingreso</span>}
                    </a>
                  </Button>
                </TooltipTrigger>
                {!showExpandedSidebar && <TooltipContent side="right">Nuevo Ingreso</TooltipContent>}
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start ${showExpandedSidebar ? "" : "px-2"} ${currentPath === "/promociones" ? "border-l-4 border-primary bg-primary/10" : ""}`}
                    asChild
                  >
                    <a href="/promociones">
                      <TrendingUp size={18} className={`${showExpandedSidebar ? "mr-2" : "mx-auto"}`} />
                      {showExpandedSidebar && <span>Promociones</span>}
                    </a>
                  </Button>
                </TooltipTrigger>
                {!showExpandedSidebar && <TooltipContent side="right">Promociones</TooltipContent>}
              </Tooltip>
            </TooltipProvider>
          </div>

        </div>

        <div className="p-4 border-t dark:border-gray-700">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={`w-full justify-start ${showExpandedSidebar ? "" : "px-2"} ${currentPath === "/settings" ? "border-l-4 border-primary bg-primary/10" : ""}`}
                  asChild
                >
                  <a href="/settings">
                    <Settings size={18} className={`${showExpandedSidebar ? "mr-2" : "mx-auto"}`} />
                    {showExpandedSidebar && <span>Configuración</span>}
                  </a>
                </Button>
              </TooltipTrigger>
              {!showExpandedSidebar && <TooltipContent side="right">Configuración</TooltipContent>}
            </Tooltip>
          </TooltipProvider>

          {showExpandedSidebar ? (
            <div className="flex items-center gap-3 mt-4 p-2 border dark:border-gray-700 rounded-md">
              <Avatar>
                <AvatarImage src={profile?.avatar || undefined} />
                <AvatarFallback>
                  {profile
                    ? `${profile.firstName[0]}${profile.lastName[0] || ""}`.toUpperCase()
                    : user?.email?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm dark:text-white truncate">
                  {profile?.displayName || user?.email?.split("@")[0] || "Usuario"}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="h-8 w-8"
                  title={theme === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
                >
                  {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-600 h-8 w-8"
                  title="Cerrar sesión"
                  onClick={async () => {
                    const { supabase } = await import('@/lib/supabase/client')
                    await supabase.auth.signOut()
                    window.location.href = '/login'
                  }}
                >
                  <LogOut size={16} />
                </Button>
              </div>
            </div>
          ) : (!isMobileView ? (
            <div className="flex flex-col items-center gap-2 mt-4">
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Avatar className="cursor-pointer">
                      <AvatarImage src={profile?.avatar || undefined} />
                      <AvatarFallback>
                        {profile
                          ? `${profile.firstName[0]}${profile.lastName[0] || ""}`.toUpperCase()
                          : user?.email?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {profile?.displayName || user?.email?.split("@")[0] || "Usuario"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleTheme}
                      title={theme === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
                    >
                      {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {theme === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600"
                      onClick={async () => {
                        const { supabase } = await import('@/lib/supabase/client')
                        await supabase.auth.signOut()
                        window.location.href = '/login'
                      }}
                    >
                      <LogOut size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Cerrar sesión</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ) : null)}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto scrollbar-thin">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-3 sm:px-6 p-2 min-h-[50px] sticky top-0 z-20">
          <div className="flex flex-col gap-3 sm:gap-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              {isMobileView && !showMobileSidebar ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="sm:hidden"
                  onClick={() => setShowMobileSidebar(true)}
                  title="Abrir menú"
                >
                  <Menu size={18} />
                </Button>
              ) : null}
              <div className="min-w-0">
                {displayTitle ? (
                  <p className="text-lg sm:text-xl font-semibold dark:text-white truncate">
                    {displayTitle}
                  </p>
                ) : null}
              </div>
            </div>

          </div>
        </header>

        {/* Dashboard Content */}
        <main className="px-3 sm:px-6 py-6 dark:bg-gray-900 dark:text-gray-100">
          {content ? (
            content
          ) : (
            <>
              <div className="flex gap-2 mb-4 sm:mb-6">
                <Button
                  variant="outline"
                  className="gap-2 text-xs sm:text-sm h-8 sm:h-10 dark:border-gray-700 dark:text-gray-300"
                >
                  <Filter size={14} className="sm:size-16" />
                  Filters
                </Button>
                <Button className="gap-2 bg-gray-900 hover:bg-black dark:bg-gray-700 dark:hover:bg-gray-600 text-white text-xs sm:text-sm h-8 sm:h-10">
                  <Plus size={14} className="sm:size-16" />
                  Add Widget
                </Button>
              </div>

              {/* Top Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">
                      Product overview
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info size={14} className="ml-1 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Total sales across all products</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </CardTitle>
                    <Select defaultValue="this-month">
                      <SelectTrigger className="h-8 w-[160px]">
                        <SelectValue placeholder="This month" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="this-month">This month</SelectItem>
                        <SelectItem value="last-month">Last month</SelectItem>
                        <SelectItem value="this-year">This year</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">$43,630</div>
                    <div className="text-sm text-gray-500">Total sales</div>

                    <div className="mt-4">
                      <div className="text-sm font-medium mb-2">Select by product</div>
                      <div className="flex gap-2 flex-wrap">
                        <Badge className="bg-orange-500 hover:bg-orange-600 text-white py-1 px-3 rounded-md flex items-center gap-1">
                          Cosmetics {" "}
                          <span className="bg-white bg-opacity-20 rounded-full w-5 h-5 flex items-center justify-center text-xs ml-1">
                            8
                          </span>
                        </Badge>
                        <Badge className="bg-orange-100 text-orange-800 py-1 px-3 rounded-md flex items-center gap-1">
                          Houseware {" "}
                          <span className="bg-orange-200 rounded-full w-5 h-5 flex items-center justify-center text-xs ml-1">
                            6
                          </span>
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <div className="text-sm">New sales:</div>
                      <div className="text-sm font-medium">153</div>
                      <ChevronDown className="h-4 w-4 text-red-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">
                      Active sales
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info size={14} className="ml-1 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Current active sales</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">$27,064</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="text-sm text-gray-500">vs last month</div>
                      <Badge className="bg-green-100 text-green-800 px-1.5 py-0.5 text-xs">+6%</Badge>
                    </div>

                    <div className="flex items-center justify-between mt-8">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 bg-orange-500 rounded"></div>
                        <div className="h-6 w-10 bg-orange-300 rounded"></div>
                        <div className="h-6 w-4 bg-orange-200 rounded"></div>
                      </div>

                      <Button variant="ghost" size="sm" className="text-gray-500 gap-1">
                        See Details
                        <ChevronRight size={16} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">
                      Product Revenue
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info size={14} className="ml-1 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Total revenue from products</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">$16,568</div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="text-sm text-gray-500">vs last month</div>
                      <Badge className="bg-green-100 text-green-800 px-1.5 py-0.5 text-xs">+3%</Badge>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="relative h-24 w-24">
                        <div className="absolute inset-0 rounded-full border-8 border-orange-100"></div>
                        <div
                          className="absolute inset-0 rounded-full border-8 border-transparent border-t-orange-500"
                          style={{ transform: "rotate(45deg)" }}
                        ></div>
                      </div>

                      <Button variant="ghost" size="sm" className="text-gray-500 gap-1">
                        See Details
                        <ChevronRight size={16} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Analytics and Performance */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card className="md:col-span-2">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">
                      Analytics
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info size={14} className="ml-1 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Sales analytics over time</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Select defaultValue="this-year">
                        <SelectTrigger className="h-8 w-[120px]">
                          <SelectValue placeholder="This year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="this-year">This year</SelectItem>
                          <SelectItem value="last-year">Last year</SelectItem>
                          <SelectItem value="all-time">All time</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm">
                        <Filter size={14} className="mr-1" />
                        Filters
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="text-2xl font-bold">-$4,5430</div>
                      <div className="text-sm">sales</div>
                      <Badge className="bg-red-100 text-red-800 px-1.5 py-0.5 text-xs">-0.4%</Badge>
                    </div>

                    <div className="h-64 w-full relative">
                      {/* Chart background */}
                      <div className="absolute inset-0 bg-gradient-to-b from-orange-100/50 to-transparent rounded-lg"></div>

                      {/* Chart line */}
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
                        <path
                          d="M0,180 C50,160 100,140 150,130 C200,120 250,140 300,130 C350,120 400,100 450,90 C500,80 550,100 600,80 C650,60 700,40 750,30 L750,200 L0,200 Z"
                          fill="none"
                          stroke="rgb(249, 115, 22)"
                          strokeWidth="2"
                        />
                        {/* Data points */}
                        <circle cx="150" cy="130" r="4" fill="white" stroke="rgb(249, 115, 22)" strokeWidth="2" />
                        <circle cx="300" cy="130" r="4" fill="white" stroke="rgb(249, 115, 22)" strokeWidth="2" />
                        <circle cx="450" cy="90" r="4" fill="white" stroke="rgb(249, 115, 22)" strokeWidth="2" />
                        <circle cx="600" cy="80" r="4" fill="white" stroke="rgb(249, 115, 22)" strokeWidth="2" />
                        <circle cx="750" cy="30" r="4" fill="white" stroke="rgb(249, 115, 22)" strokeWidth="2" />

                        {/* Highlight point */}
                        <g transform="translate(540, 50)">
                          <rect x="-20" y="-15" width="40" height="25" rx="4" fill="black" />
                          <text x="0" y="0" textAnchor="middle" fill="white" dominantBaseline="middle" fontSize="12">
                            -19%
                          </text>
                          <rect x="-5" y="10" width="10" height="100" rx="5" fill="rgb(249, 115, 22)" opacity="0.7" />
                        </g>
                      </svg>

                      {/* X-axis labels */}
                      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 px-4">
                        <div>JAN</div>
                        <div>FEB</div>
                        <div>MAR</div>
                        <div>APR</div>
                        <div>MAY</div>
                        <div>JUN</div>
                        <div>JUL</div>
                        <div>AUG</div>
                      </div>

                      {/* Y-axis labels */}
                      <div className="absolute top-0 left-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 py-4">
                        <div>$5K</div>
                        <div>$4K</div>
                        <div>$3K</div>
                        <div>$2K</div>
                        <div>$1K</div>
                        <div>$0K</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">
                      Sales Performance
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info size={14} className="ml-1 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Current sales performance</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center mb-4">
                      <div className="relative h-40 w-40">
                        {/* Background circle */}
                        <div className="absolute inset-0 rounded-full border-[16px] border-gray-100"></div>

                        {/* Progress circle */}
                        <div
                          className="absolute inset-0 rounded-full border-[16px] border-transparent border-t-orange-500 border-r-orange-500"
                          style={{ transform: "rotate(60deg)" }}
                        ></div>

                        {/* Inner content */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="text-3xl font-bold">17.9%</div>
                          <div className="text-xs text-gray-500">Since yesterday</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-1 w-4 bg-orange-500 rounded"></div>
                          <div className="text-sm">Total Sales per day</div>
                        </div>
                        <div className="text-xs text-gray-500">For week</div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-1 w-4 bg-orange-200 rounded"></div>
                          <div className="text-sm">Average Sales</div>
                        </div>
                        <div className="text-xs text-gray-500">For today</div>
                      </div>

                      <Button variant="ghost" size="sm" className="w-full text-gray-500 gap-1 mt-4">
                        See Details
                        <ChevronRight size={16} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Visits and Top Products */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">
                      Total visits by hourly
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info size={14} className="ml-1 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Hourly visit statistics</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </CardTitle>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal size={16} />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="text-2xl font-bold">288,822</div>
                      <Badge className="bg-green-100 text-green-800 px-1.5 py-0.5 text-xs">+4%</Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <div className="w-8">MON</div>
                        <div className="grid grid-cols-12 gap-1 flex-1">
                          {Array(12)
                            .fill(0)
                            .map((_, i) => (
                              <div key={i} className={`h-6 rounded ${i === 3 ? "bg-orange-200" : "bg-gray-100"}`}></div>
                            ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <div className="w-8">TUE</div>
                        <div className="grid grid-cols-12 gap-1 flex-1">
                          {Array(12)
                            .fill(0)
                            .map((_, i) => (
                              <div
                                key={i}
                                className={`h-6 rounded ${i === 10 ? "bg-orange-400" : "bg-gray-100"}`}
                              ></div>
                            ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <div className="w-8">WED</div>
                        <div className="grid grid-cols-12 gap-1 flex-1">
                          {Array(12)
                            .fill(0)
                            .map((_, i) => (
                              <div key={i} className={`h-6 rounded ${i === 8 ? "bg-orange-500" : "bg-gray-100"}`}></div>
                            ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4 text-xs">
                      <Badge className="bg-orange-200 text-orange-800 px-1.5 py-0.5">9:00-10:00 AM</Badge>
                      <Button variant="ghost" size="icon" className="h-5 w-5">
                        <X size={12} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">
                      Top Products
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info size={14} className="ml-1 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Best performing products</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="text-orange-500 gap-1">
                      See Details
                      <ChevronRight size={16} />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Sales</TableHead>
                          <TableHead>Revenue</TableHead>
                          <TableHead>Stock</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>
                            <div className="bg-yellow-500 text-white p-1 rounded w-6 h-6 flex items-center justify-center">
                              <Package size={12} />
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            <div>Bikini Shorts</div>
                            <div className="text-xs text-gray-500">Comfortable and stylish</div>
                          </TableCell>
                          <TableCell>127</TableCell>
                          <TableCell>$1,950</TableCell>
                          <TableCell>90</TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800">In stock</Badge>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                            <div className="bg-yellow-500 text-white p-1 rounded w-6 h-6 flex items-center justify-center">
                              <Package size={12} />
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            <div>Bikini Shorts</div>
                          </TableCell>
                          <TableCell>540</TableCell>
                          <TableCell>$2,889</TableCell>
                          <TableCell>100</TableCell>
                          <TableCell>
                            <Badge className="bg-red-100 text-red-800">Out of stock</Badge>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </main>
      </div>
      {isMobileView && showMobileSidebar && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowMobileSidebar(false)} />
      )}
    </div>
  )
}
