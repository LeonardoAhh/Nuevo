"use client"

import { useState, useEffect, useLayoutEffect, type ReactNode } from "react"
import {
  Car,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
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
  ChevronsUpDown,
  Paintbrush,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}

interface NavSection {
  sectionLabel: string
  items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    sectionLabel: "General",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
    ],
  },
  {
    sectionLabel: "Contratos",
    items: [
      { label: "Nuevo Ingreso", href: "/nuevo-ingreso", icon: UserPlus },
    ],
  },
  {
    sectionLabel: "Capacitación",
    items: [
      { label: "Capacitación", href: "/capacitacion", icon: GraduationCap },
      { label: "Promociones", href: "/promociones", icon: TrendingUp },
      { label: "Exámenes", href: "/examenes", icon: ClipboardCheck },
    ],
  },
  {
    sectionLabel: "Edición",
    items: [
      { label: "Flayers", href: "/flayers", icon: Paintbrush },
    ],
  },
]

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

  const avatarFallback =
    profile
      ? `${profile.firstName?.[0] ?? ""}${profile.lastName?.[0] ?? ""}`.toUpperCase() || "U"
      : user?.email?.[0]?.toUpperCase() ?? "U"

  const displayName =
    profile?.displayName || user?.email?.split("@")[0] || "Usuario"

  const handleLogout = async () => {
    const { supabase } = await import("@/lib/supabase/client")
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  // Leer valores reales antes del primer paint (sin mismatch, sin flash)
  useLayoutEffect(() => {
    setSidebarCollapsed(localStorage.getItem("sidebarCollapsed") === "true")
    setIsMobileView(window.innerWidth < 768)
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
    <div className="flex flex-col md:flex-row h-screen bg-background">
      {/* Sidebar */}
      <div
        className={`bg-card border-r transition-all duration-300 flex flex-col max-md:fixed max-md:z-50 max-md:h-screen max-md:shadow-lg max-md:w-64 max-md:-translate-x-full ${showMobileSidebar ? "max-md:translate-x-0" : ""} ${sidebarCollapsed ? "md:w-20" : "md:w-64"}`}
      >
        <div className="p-2 h-[50px] border-b flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {showExpandedSidebar && (
              <>
                <div className="bg-primary text-primary-foreground p-2 rounded">
                  <Car size={16} />
                </div>
                <div>
                  <div className="font-semibold">VIÑOPLASTIC</div>
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
          <div className="space-y-3 p-2">
            {NAV_SECTIONS.map((section, sectionIdx) => (
              <div key={section.sectionLabel}>
                {showExpandedSidebar ? (
                  <div className="px-3 pt-2 pb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {section.sectionLabel}
                    </span>
                  </div>
                ) : (
                  sectionIdx > 0 && <div className="mx-3 my-1 border-t" />
                )}
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <TooltipProvider key={item.href} delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            className={`w-full justify-start ${showExpandedSidebar ? "" : "px-2"} ${currentPath === item.href ? "border-l-4 border-primary bg-primary/10" : ""}`}
                            asChild
                          >
                            <a href={item.href}>
                              <item.icon size={18} className={showExpandedSidebar ? "mr-2" : "mx-auto"} />
                              {showExpandedSidebar && <span>{item.label}</span>}
                            </a>
                          </Button>
                        </TooltipTrigger>
                        {!showExpandedSidebar && <TooltipContent side="right">{item.label}</TooltipContent>}
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Bottom — User Menu */}
        <div className="p-2 border-t">
          <DropdownMenu>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    {showExpandedSidebar ? (
                      <button
                        className="w-full flex items-center gap-3 rounded-md px-2 py-2 text-sm
                                   hover:bg-accent hover:text-accent-foreground
                                   focus-visible:outline-none focus-visible:ring-2
                                   focus-visible:ring-ring transition-colors"
                      >
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={profile?.avatar || undefined} />
                          <AvatarFallback className="text-xs">{avatarFallback}</AvatarFallback>
                        </Avatar>
                        <span className="flex-1 min-w-0 text-left">
                          <span className="block font-medium text-sm truncate">
                            {displayName}
                          </span>
                        </span>
                        <ChevronsUpDown size={14} className="shrink-0 text-muted-foreground" />
                      </button>
                    ) : (
                      <button
                        className="flex items-center justify-center w-full py-2
                                   rounded-md hover:bg-accent hover:text-accent-foreground
                                   focus-visible:outline-none focus-visible:ring-2
                                   focus-visible:ring-ring transition-colors"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={profile?.avatar || undefined} />
                          <AvatarFallback className="text-xs">{avatarFallback}</AvatarFallback>
                        </Avatar>
                      </button>
                    )}
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                {!showExpandedSidebar && (
                  <TooltipContent side="right">{displayName}</TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>

            <DropdownMenuContent side="top" align="start" sideOffset={8} className="w-56">
              <DropdownMenuLabel asChild>
                <div className="flex items-center gap-3 px-2 py-2 cursor-default select-none">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={profile?.avatar || undefined} />
                    <AvatarFallback className="text-xs">{avatarFallback}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold truncate">{displayName}</span>
                    <span className="text-xs text-muted-foreground truncate">{user?.email ?? ""}</span>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                asChild
                className={
                  currentPath === "/settings"
                    ? "bg-primary/10 text-primary focus:bg-primary/20 focus:text-primary"
                    : ""
                }
              >
                <a href="/settings" className="flex items-center gap-2 cursor-pointer">
                  <Settings size={16} />
                  <span>Configuración</span>
                </a>
              </DropdownMenuItem>

              <DropdownMenuItem
                onSelect={(e) => { e.preventDefault(); toggleTheme() }}
                className="flex items-center gap-2 cursor-pointer"
              >
                {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
                <span>Apariencia</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {theme === "light" ? "Oscuro" : "Claro"}
                </span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onSelect={handleLogout}
                className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <LogOut size={16} />
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto scrollbar-thin">
        {/* Header */}
        <header className="bg-card border-b px-3 sm:px-6 p-2 min-h-[50px] sticky top-0 z-20">
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
                  <p className="text-lg sm:text-xl font-semibold truncate">
                    {displayTitle}
                  </p>
                ) : null}
              </div>
            </div>

          </div>
        </header>

        {/* Dashboard Content */}
        <main className="px-3 sm:px-6 py-6 bg-background">
          {content ? (
            content
          ) : (
            <>
              <div className="flex gap-2 mb-4 sm:mb-6">
                <Button
                  variant="outline"
                  className="gap-2 text-xs sm:text-sm h-8 sm:h-10"
                >
                  <Filter size={14} className="sm:size-16" />
                  Filters
                </Button>
                <Button className="gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 text-xs sm:text-sm h-8 sm:h-10">
                  <Plus size={14} className="sm:size-16" />
                  Add Widget
                </Button>
              </div>

              {/* Top Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
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
                      <SelectTrigger className="h-8 w-full sm:w-[160px]">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-6">
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
                        <SelectTrigger className="h-8 w-full sm:w-[120px]">
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
