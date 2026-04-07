"use client"

import { useState } from "react"
import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Edit,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

// Sample data for tasks
const initialTasks = [
  {
    id: 1,
    title: "Redesign landing page",
    description: "Update the hero section and improve mobile responsiveness",
    status: "in-progress",
    priority: "high",
    dueDate: "2023-12-15",
    assignee: "John Doe",
    tags: ["design", "website"],
  },
  {
    id: 2,
    title: "Fix checkout bug",
    description: "Address payment processing issue on the checkout page",
    status: "todo",
    priority: "critical",
    dueDate: "2023-12-10",
    assignee: "Sarah Johnson",
    tags: ["bug", "payment"],
  },
  {
    id: 3,
    title: "Create social media assets",
    description: "Design graphics for upcoming product launch campaign",
    status: "completed",
    priority: "medium",
    dueDate: "2023-12-05",
    assignee: "Emily Chen",
    tags: ["design", "marketing"],
  },
  {
    id: 4,
    title: "Update API documentation",
    description: "Document new endpoints and update examples",
    status: "todo",
    priority: "low",
    dueDate: "2023-12-20",
    assignee: "Michael Brown",
    tags: ["documentation", "development"],
  },
  {
    id: 5,
    title: "Conduct user testing",
    description: "Organize sessions to test new features with users",
    status: "in-progress",
    priority: "high",
    dueDate: "2023-12-18",
    assignee: "John Doe",
    tags: ["research", "user-experience"],
  },
  {
    id: 6,
    title: "Optimize database queries",
    description: "Improve performance of slow-running queries",
    status: "todo",
    priority: "medium",
    dueDate: "2023-12-22",
    assignee: "David Wilson",
    tags: ["development", "performance"],
  },
]

export default function TaskContent() {
  const [tasks, setTasks] = useState(initialTasks)
  const [selectedTab, setSelectedTab] = useState("all")
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    dueDate: "",
    assignee: "",
    tags: [],
  })
  const [tagInput, setTagInput] = useState("")
  const [isEditTaskOpen, setIsEditTaskOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [editTagInput, setEditTagInput] = useState("")

  // Filter tasks based on selected tab
  const filteredTasks = selectedTab === "all" ? tasks : tasks.filter((task) => task.status === selectedTab)

  const handleAddTask = () => {
    if (!newTask.title) return

    const task = {
      ...newTask,
      id: tasks.length + 1,
    }

    setTasks([...tasks, task])
    setIsAddTaskOpen(false)
    setNewTask({
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
      dueDate: "",
      assignee: "",
      tags: [],
    })
  }

  const handleEditTask = (task) => {
    setEditingTask(task)
    setIsEditTaskOpen(true)
    setEditTagInput("")
  }

  const handleSaveEditedTask = () => {
    if (!editingTask || !editingTask.title) return

    setTasks(tasks.map((task) => (task.id === editingTask.id ? editingTask : task)))
    setIsEditTaskOpen(false)
    setEditingTask(null)
  }

  const handleAddEditTag = () => {
    if (!editTagInput.trim()) return

    setEditingTask({
      ...editingTask,
      tags: [...editingTask.tags, editTagInput.trim()],
    })
    setEditTagInput("")
  }

  const handleRemoveEditTag = (tagToRemove) => {
    setEditingTask({
      ...editingTask,
      tags: editingTask.tags.filter((tag) => tag !== tagToRemove),
    })
  }

  const handleAddTag = () => {
    if (!tagInput.trim()) return

    setNewTask({
      ...newTask,
      tags: [...newTask.tags, tagInput.trim()],
    })
    setTagInput("")
  }

  const handleRemoveTag = (tagToRemove) => {
    setNewTask({
      ...newTask,
      tags: newTask.tags.filter((tag) => tag !== tagToRemove),
    })
  }

  const handleDeleteTask = (id) => {
    setTasks(tasks.filter((task) => task.id !== id))
  }

  const handleStatusChange = (id, newStatus) => {
    setTasks(tasks.map((task) => (task.id === id ? { ...task, status: newStatus } : task)))
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "critical":
        return "bg-red-500 text-white"
      case "high":
        return "bg-orange-500 text-white"
      case "medium":
        return "bg-blue-500 text-white"
      case "low":
        return "bg-green-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="text-green-500" size={18} />
      case "in-progress":
        return <Clock className="text-blue-500" size={18} />
      case "todo":
        return <Circle className="text-gray-400" size={18} />
      default:
        return <Circle className="text-gray-400" size={18} />
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Task Management</h1>
          <p className="text-gray-500">Organize and track your tasks efficiently</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Filter size={16} />
            Filters
          </Button>
          <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gray-900 hover:bg-black text-white">
                <Plus size={16} />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Task</DialogTitle>
                <DialogDescription>Create a new task with details and assign it to team members.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="title" className="text-sm font-medium">
                    Title
                  </label>
                  <Input
                    id="title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder="Task title"
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Description
                  </label>
                  <Textarea
                    id="description"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Task description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label htmlFor="priority" className="text-sm font-medium">
                      Priority
                    </label>
                    <Select
                      value={newTask.priority}
                      onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="status" className="text-sm font-medium">
                      Status
                    </label>
                    <Select value={newTask.status} onValueChange={(value) => setNewTask({ ...newTask, status: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label htmlFor="dueDate" className="text-sm font-medium">
                      Due Date
                    </label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="assignee" className="text-sm font-medium">
                      Assignee
                    </label>
                    <Input
                      id="assignee"
                      value={newTask.assignee}
                      onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                      placeholder="Assignee name"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <label htmlFor="tags" className="text-sm font-medium">
                    Tags
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="tags"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Add tag"
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
                    {newTask.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <X size={14} className="cursor-pointer" onClick={() => handleRemoveTag(tag)} />
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddTaskOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddTask}>Save Task</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isEditTaskOpen} onOpenChange={setIsEditTaskOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Edit Task</DialogTitle>
                <DialogDescription>Update task details and assignments.</DialogDescription>
              </DialogHeader>
              {editingTask && (
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label htmlFor="edit-title" className="text-sm font-medium">
                      Title
                    </label>
                    <Input
                      id="edit-title"
                      value={editingTask.title}
                      onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                      placeholder="Task title"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="edit-description" className="text-sm font-medium">
                      Description
                    </label>
                    <Textarea
                      id="edit-description"
                      value={editingTask.description}
                      onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                      placeholder="Task description"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <label htmlFor="edit-priority" className="text-sm font-medium">
                        Priority
                      </label>
                      <Select
                        value={editingTask.priority}
                        onValueChange={(value) => setEditingTask({ ...editingTask, priority: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="critical">Critical</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <label htmlFor="edit-status" className="text-sm font-medium">
                        Status
                      </label>
                      <Select
                        value={editingTask.status}
                        onValueChange={(value) => setEditingTask({ ...editingTask, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todo">To Do</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <label htmlFor="edit-dueDate" className="text-sm font-medium">
                        Due Date
                      </label>
                      <Input
                        id="edit-dueDate"
                        type="date"
                        value={editingTask.dueDate}
                        onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <label htmlFor="edit-assignee" className="text-sm font-medium">
                        Assignee
                      </label>
                      <Input
                        id="edit-assignee"
                        value={editingTask.assignee}
                        onChange={(e) => setEditingTask({ ...editingTask, assignee: e.target.value })}
                        placeholder="Assignee name"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="edit-tags" className="text-sm font-medium">
                      Tags
                    </label>
                    <div className="flex gap-2">
                      <Input
                        id="edit-tags"
                        value={editTagInput}
                        onChange={(e) => setEditTagInput(e.target.value)}
                        placeholder="Add tag"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            handleAddEditTag()
                          }
                        }}
                      />
                      <Button type="button" onClick={handleAddEditTag} variant="outline">
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {editingTask.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <X size={14} className="cursor-pointer" onClick={() => handleRemoveEditTag(tag)} />
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditTaskOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEditedTask}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Task Tabs and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <Tabs defaultValue="all" className="w-full md:w-auto" onValueChange={setSelectedTab}>
          <TabsList className="grid grid-cols-4 w-full md:w-auto">
            <TabsTrigger value="all">All Tasks</TabsTrigger>
            <TabsTrigger value="todo">To Do</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input type="search" placeholder="Search tasks..." className="w-full pl-8" />
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <Card key={task.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                <div className="p-4 flex-1">
                  <div className="flex items-start gap-3">
                    <div
                      className="mt-1 cursor-pointer"
                      onClick={() => {
                        const newStatus = task.status === "completed" ? "todo" : "completed"
                        handleStatusChange(task.id, newStatus)
                      }}
                    >
                      {getStatusIcon(task.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <h3 className="font-medium text-lg">{task.title}</h3>
                        <Badge className={`${getPriorityColor(task.priority)}`}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-gray-500 text-sm mt-1">{task.description}</p>

                      <div className="flex flex-wrap gap-2 mt-3">
                        {task.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="flex items-center gap-1">
                            <Tag size={12} />
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                        <div>Assignee: {task.assignee}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex md:flex-col justify-end border-t md:border-t-0 md:border-l p-2 md:p-4">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditTask(task)}>
                          <Edit size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit task</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete task</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>More options</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
              <CheckCircle2 className="text-gray-400" size={24} />
            </div>
            <h3 className="text-lg font-medium">No tasks found</h3>
            <p className="text-gray-500 mt-1">
              {selectedTab === "all"
                ? "You don't have any tasks yet. Create one to get started."
                : `You don't have any ${selectedTab.replace("-", " ")} tasks.`}
            </p>
            <Button className="mt-4" variant="outline" onClick={() => setIsAddTaskOpen(true)}>
              <Plus size={16} className="mr-2" />
              Add a task
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
