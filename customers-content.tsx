"use client"

import { useState } from "react"
import {
  ChevronDown,
  Download,
  Filter,
  MoreHorizontal,
  Search,
  SlidersHorizontal,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// Sample customer data
const customers = [
  {
    id: 1,
    name: "Olivia Martin",
    email: "olivia.martin@email.com",
    image: "/diverse-group-city.png",
    status: "active",
    spent: 1999.0,
    orders: 12,
    lastOrder: "2023-12-15",
    location: "New York, USA",
  },
  {
    id: 2,
    name: "Jackson Lee",
    email: "jackson.lee@email.com",
    image: "/thoughtful-portrait.png",
    status: "active",
    spent: 4599.5,
    orders: 24,
    lastOrder: "2023-12-10",
    location: "San Francisco, USA",
  },
  {
    id: 3,
    name: "Isabella Nguyen",
    email: "isabella.nguyen@email.com",
    image: "/diverse-group-chatting.png",
    status: "inactive",
    spent: 699.0,
    orders: 4,
    lastOrder: "2023-11-05",
    location: "Chicago, USA",
  },
  {
    id: 4,
    name: "William Chen",
    email: "william.chen@email.com",
    image: "/team-brainstorm.png",
    status: "active",
    spent: 2799.25,
    orders: 18,
    lastOrder: "2023-12-12",
    location: "Toronto, Canada",
  },
  {
    id: 5,
    name: "Sofia Rodriguez",
    email: "sofia.rodriguez@email.com",
    image: "/diverse-group-city.png",
    status: "active",
    spent: 1249.75,
    orders: 9,
    lastOrder: "2023-12-08",
    location: "Miami, USA",
  },
  {
    id: 6,
    name: "Ethan Johnson",
    email: "ethan.johnson@email.com",
    image: "/thoughtful-portrait.png",
    status: "inactive",
    spent: 499.5,
    orders: 3,
    lastOrder: "2023-10-22",
    location: "London, UK",
  },
]

export default function CustomersContent() {
  const [selectedTab, setSelectedTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Filter customers based on tab and search query
  const filteredCustomers = customers.filter((customer) => {
    // Filter by tab
    if (selectedTab === "active" && customer.status !== "active") return false
    if (selectedTab === "inactive" && customer.status !== "inactive") return false

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        customer.name.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query) ||
        customer.location.toLowerCase().includes(query)
      )
    }

    return true
  })

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Customers</h1>
          <p className="text-gray-500 text-sm sm:text-base">Manage your customer relationships</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 text-xs sm:text-sm h-8 sm:h-10">
            <Download size={14} className="sm:size-16" />
            Export
          </Button>
          <Button className="gap-2 bg-gray-900 hover:bg-black text-white text-xs sm:text-sm h-8 sm:h-10">
            <UserPlus size={14} className="sm:size-16" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Tabs and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
        <Tabs defaultValue="all" className="w-full sm:w-auto" onValueChange={setSelectedTab} value={selectedTab}>
          <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex">
            <TabsTrigger value="all" className="text-xs sm:text-sm">
              All Customers ({customers.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="text-xs sm:text-sm">
              Active ({customers.filter((c) => c.status === "active").length})
            </TabsTrigger>
            <TabsTrigger value="inactive" className="text-xs sm:text-sm">
              Inactive ({customers.filter((c) => c.status === "inactive").length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search customers..."
              className="w-full pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="h-10 w-10">
            <Filter size={16} />
          </Button>
          <Button variant="outline" size="icon" className="h-10 w-10">
            <SlidersHorizontal size={16} />
          </Button>
        </div>
      </div>

      {/* Customers Table */}
      <Card>
        <CardHeader className="p-4 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-medium">Customer List</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1">
                <span>Bulk Actions</span>
                <ChevronDown size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Download size={14} className="mr-2" /> Export Selected
              </DropdownMenuItem>
              <DropdownMenuItem>
                <UserPlus size={14} className="mr-2" /> Add to Group
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Trash2 size={14} className="mr-2" /> Delete Selected
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input type="checkbox" className="rounded border-gray-300" />
                </TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Last Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <input type="checkbox" className="rounded border-gray-300" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={customer.image || "/placeholder.svg"} alt={customer.name} />
                          <AvatarFallback>
                            {customer.name.charAt(0)}
                            {customer.name.split(" ")[1]?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-gray-500">{customer.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          customer.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }
                      >
                        {customer.status === "active" ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>${customer.spent.toFixed(2)}</TableCell>
                    <TableCell>{customer.orders}</TableCell>
                    <TableCell>{customer.location}</TableCell>
                    <TableCell>{new Date(customer.lastOrder).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Edit Customer</DropdownMenuItem>
                          <DropdownMenuItem>View Orders</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">Delete Customer</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Users size={48} className="mb-2 opacity-20" />
                      <h3 className="text-lg font-medium">No customers found</h3>
                      <p className="text-sm">
                        {searchQuery ? "Try adjusting your search or filters" : "Add a customer to get started"}
                      </p>
                      {searchQuery && (
                        <Button variant="outline" className="mt-4" onClick={() => setSearchQuery("")}>
                          Clear Search
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}
