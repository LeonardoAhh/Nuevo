"use client"

import { useState } from "react"
import {
  Bell,
  CreditCard,
  Globe,
  Key,
  Laptop,
  Moon,
  Palette,
  Shield,
  Sun,
  User,
  Users,
  Zap,
  Plus,
  Check,
  Paintbrush,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "@/theme-context"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ColorPicker } from "@/components/color-picker"
import { Alert, AlertDescription } from "@/components/ui/alert"

type AccentColor = "blue" | "purple" | "green" | "orange" | "pink" | "yellow" | "custom"

interface ColorOption {
  name: AccentColor
  value: string
  textColor: string
}

const colorOptions: ColorOption[] = [
  { name: "blue", value: "bg-blue-500", textColor: "text-white" },
  { name: "purple", value: "bg-purple-500", textColor: "text-white" },
  { name: "green", value: "bg-green-500", textColor: "text-white" },
  { name: "orange", value: "bg-orange-500", textColor: "text-white" },
  { name: "pink", value: "bg-pink-500", textColor: "text-white" },
  { name: "yellow", value: "bg-yellow-500", textColor: "text-black" },
]

export default function SettingsContent() {
  const [activeTab, setActiveTab] = useState("profile")
  const { theme, accentColor, customColor, setTheme, setAccentColor, setCustomColor, isColorLight } = useTheme()
  const [showSavedMessage, setShowSavedMessage] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Direct application of theme changes
  const handleThemeChange = (newTheme: "light" | "dark") => {
    setTheme(newTheme)
  }

  const handleAccentColorChange = (color: AccentColor) => {
    setAccentColor(color)
  }

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color)
    setAccentColor("custom")
  }

  const saveThemePreferences = () => {
    try {
      // Show success message
      setShowSavedMessage(true)
      setSaveError(null)
      setTimeout(() => {
        setShowSavedMessage(false)
      }, 3000)
    } catch (error) {
      console.error("Error saving theme preferences:", error)
      setSaveError("Failed to save preferences. Please try again.")
    }
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2 sm:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Settings</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-6 gap-2">
          <TabsTrigger value="profile" className="text-xs sm:text-sm">
            <User className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="account" className="text-xs sm:text-sm">
            <Users className="mr-2 h-4 w-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs sm:text-sm">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="text-xs sm:text-sm">
            <Shield className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="appearance" className="text-xs sm:text-sm">
            <Palette className="mr-2 h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="integrations" className="text-xs sm:text-sm">
            <Zap className="mr-2 h-4 w-4" />
            Integrations
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="space-y-4">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-white">Profile Information</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Update your personal information and profile picture.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <Avatar className="h-24 w-24">
                  <AvatarImage src="/diverse-group-city.png" alt="Profile" />
                  <AvatarFallback>JK</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-200">
                    Change Avatar
                  </Button>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    JPG, GIF or PNG. Max size 2MB. Square image recommended.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first-name" className="dark:text-gray-200">
                    First Name
                  </Label>
                  <Input
                    id="first-name"
                    defaultValue="Jovine"
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name" className="dark:text-gray-200">
                    Last Name
                  </Label>
                  <Input
                    id="last-name"
                    defaultValue="Klef"
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display-name" className="dark:text-gray-200">
                    Display Name
                  </Label>
                  <Input
                    id="display-name"
                    defaultValue="Jovine Klef"
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="dark:text-gray-200">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue="jovine.klef@example.com"
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="dark:text-gray-200">
                  Bio
                </Label>
                <Textarea
                  id="bio"
                  placeholder="Write a short bio about yourself..."
                  defaultValue="Product designer and developer based in New York. I enjoy creating user-centric, delightful, and human experiences."
                  className="min-h-[120px] dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Brief description for your profile. URLs are hyperlinked.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website" className="dark:text-gray-200">
                  Website
                </Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://example.com"
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" className="dark:border-gray-600 dark:text-gray-200">
                Cancel
              </Button>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Save Changes</Button>
            </CardFooter>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-white">Professional Information</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Update your professional details and skills.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="job-title" className="dark:text-gray-200">
                    Job Title
                  </Label>
                  <Input
                    id="job-title"
                    defaultValue="Senior Product Designer"
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company" className="dark:text-gray-200">
                    Company
                  </Label>
                  <Input
                    id="company"
                    defaultValue="Veselty Inc."
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location" className="dark:text-gray-200">
                    Location
                  </Label>
                  <Input
                    id="location"
                    defaultValue="New York, USA"
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone" className="dark:text-gray-200">
                    Timezone
                  </Label>
                  <Select defaultValue="america-new_york">
                    <SelectTrigger id="timezone" className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                      <SelectItem value="america-new_york">Eastern Time (US & Canada)</SelectItem>
                      <SelectItem value="america-chicago">Central Time (US & Canada)</SelectItem>
                      <SelectItem value="america-denver">Mountain Time (US & Canada)</SelectItem>
                      <SelectItem value="america-los_angeles">Pacific Time (US & Canada)</SelectItem>
                      <SelectItem value="europe-london">London</SelectItem>
                      <SelectItem value="europe-paris">Paris</SelectItem>
                      <SelectItem value="asia-tokyo">Tokyo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="dark:text-gray-200">Skills</Label>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="px-3 py-1 dark:bg-gray-700 dark:text-gray-200">
                    UI Design
                  </Badge>
                  <Badge variant="secondary" className="px-3 py-1 dark:bg-gray-700 dark:text-gray-200">
                    UX Research
                  </Badge>
                  <Badge variant="secondary" className="px-3 py-1 dark:bg-gray-700 dark:text-gray-200">
                    Prototyping
                  </Badge>
                  <Badge variant="secondary" className="px-3 py-1 dark:bg-gray-700 dark:text-gray-200">
                    Figma
                  </Badge>
                  <Badge variant="secondary" className="px-3 py-1 dark:bg-gray-700 dark:text-gray-200">
                    React
                  </Badge>
                  <Button variant="outline" size="sm" className="h-7 px-3 py-1 dark:border-gray-600 dark:text-gray-200">
                    + Add Skill
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" className="dark:border-gray-600 dark:text-gray-200">
                Cancel
              </Button>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Account Settings */}
        <TabsContent value="account" className="space-y-4">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-white">Account Information</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Manage your account details and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="dark:text-gray-200">
                    Username
                  </Label>
                  <Input
                    id="username"
                    defaultValue="jovineklef"
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account-email" className="dark:text-gray-200">
                    Email
                  </Label>
                  <Input
                    id="account-email"
                    type="email"
                    defaultValue="jovine.klef@example.com"
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language" className="dark:text-gray-200">
                    Language
                  </Label>
                  <Select defaultValue="en">
                    <SelectTrigger id="language" className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-format" className="dark:text-gray-200">
                    Date Format
                  </Label>
                  <Select defaultValue="mm-dd-yyyy">
                    <SelectTrigger
                      id="date-format"
                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                    >
                      <SelectValue placeholder="Select date format" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                      <SelectItem value="mm-dd-yyyy">MM/DD/YYYY</SelectItem>
                      <SelectItem value="dd-mm-yyyy">DD/MM/YYYY</SelectItem>
                      <SelectItem value="yyyy-mm-dd">YYYY/MM/DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" className="dark:border-gray-600 dark:text-gray-200">
                Cancel
              </Button>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Save Changes</Button>
            </CardFooter>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-white">Billing Information</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Manage your billing details and subscription.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full">
                    <CreditCard className="h-6 w-6 dark:text-gray-300" />
                  </div>
                  <div>
                    <p className="font-medium dark:text-gray-200">Pro Plan</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">$29/month, renews on Aug 15, 2023</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-200">
                  Change Plan
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="dark:text-gray-200">Payment Method</Label>
                <div className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                      <svg
                        className="h-6 w-6 text-blue-600 dark:text-blue-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect width="20" height="14" x="2" y="5" rx="2" />
                        <line x1="2" x2="22" y1="10" y2="10" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium dark:text-gray-200">Visa ending in 4242</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Expires 12/24</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="dark:text-gray-300">
                    Edit
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="dark:text-gray-200">Billing Address</Label>
                <div className="p-4 border rounded-lg dark:border-gray-700">
                  <p className="font-medium dark:text-gray-200">Jovine Klef</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">123 Main St, Apt 4B</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">New York, NY 10001</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">United States</p>
                  <Button variant="link" className="p-0 h-auto mt-2 dark:text-blue-400">
                    Edit Address
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" className="dark:border-gray-600 dark:text-gray-200">
                View Billing History
              </Button>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Update Billing</Button>
            </CardFooter>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Irreversible and destructive actions that affect your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-900/30 rounded-lg">
                <div>
                  <p className="font-medium dark:text-gray-200">Delete Account</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Permanently delete your account and all of your content.
                  </p>
                </div>
                <Button variant="destructive">Delete Account</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-white">Notification Preferences</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Manage how and when you receive notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium dark:text-gray-200">Email Notifications</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base dark:text-gray-200">Product Updates</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Receive emails about product updates and features.
                      </p>
                    </div>
                    <Switch />
                  </div>
                  <Separator className="dark:bg-gray-700" />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base dark:text-gray-200">Comments</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Receive emails when someone comments on your posts.
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator className="dark:bg-gray-700" />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base dark:text-gray-200">Mentions</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Receive emails when someone mentions you.
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator className="dark:bg-gray-700" />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base dark:text-gray-200">Marketing</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Receive emails about new products, features, and more.
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium dark:text-gray-200">Push Notifications</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base dark:text-gray-200">Comments</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Receive push notifications when someone comments on your posts.
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator className="dark:bg-gray-700" />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base dark:text-gray-200">Mentions</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Receive push notifications when someone mentions you.
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator className="dark:bg-gray-700" />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base dark:text-gray-200">Direct Messages</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Receive push notifications when you receive a direct message.
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Save Preferences</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-white">Password</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Change your password to keep your account secure.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password" className="dark:text-gray-200">
                  Current Password
                </Label>
                <Input
                  id="current-password"
                  type="password"
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password" className="dark:text-gray-200">
                  New Password
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="dark:text-gray-200">
                  Confirm New Password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Update Password</Button>
            </CardFooter>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-white">Two-Factor Authentication</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Add an extra layer of security to your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base dark:text-gray-200">Two-Factor Authentication</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Secure your account with two-factor authentication.
                  </p>
                </div>
                <Switch />
              </div>
              <Separator className="dark:bg-gray-700" />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base dark:text-gray-200">Authenticator App</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Use an authenticator app to generate one-time codes.
                  </p>
                </div>
                <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-200">
                  Setup
                </Button>
              </div>
              <Separator className="dark:bg-gray-700" />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base dark:text-gray-200">SMS Authentication</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Receive one-time codes via SMS to verify your identity.
                  </p>
                </div>
                <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-200">
                  Setup
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-white">Sessions</CardTitle>
              <CardDescription className="dark:text-gray-400">Manage your active sessions and devices.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700">
                  <div className="flex items-center gap-4">
                    <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
                      <Laptop className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium dark:text-gray-200">MacBook Pro - New York</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Current session • Last active: Just now
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    Current
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700">
                  <div className="flex items-center gap-4">
                    <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full">
                      <Globe className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium dark:text-gray-200">Chrome - Windows</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Last active: 2 days ago</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="text-red-500 dark:border-gray-600">
                    Sign Out
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700">
                  <div className="flex items-center gap-4">
                    <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full">
                      <Globe className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium dark:text-gray-200">Safari - iPhone</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Last active: 5 days ago</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="text-red-500 dark:border-gray-600">
                    Sign Out
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="text-red-500 dark:border-gray-600 dark:text-red-400">
                Sign Out All Other Sessions
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-4">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-white">Theme</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Customize the appearance of the application.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="dark:text-gray-200">Color Mode</Label>
                <div className="flex gap-4">
                  <div
                    className={`flex flex-col items-center gap-2 p-4 border rounded-lg cursor-pointer ${
                      theme === "light" ? "border-primary bg-primary/10" : "dark:border-gray-600"
                    }`}
                    onClick={() => handleThemeChange("light")}
                  >
                    <div className="bg-white border shadow-sm p-2 rounded-full">
                      <Sun className="h-6 w-6 text-yellow-500" />
                    </div>
                    <span className="font-medium dark:text-gray-200">Light</span>
                  </div>
                  <div
                    className={`flex flex-col items-center gap-2 p-4 border rounded-lg cursor-pointer ${
                      theme === "dark" ? "border-primary bg-primary/10" : "dark:border-gray-600"
                    }`}
                    onClick={() => handleThemeChange("dark")}
                  >
                    <div className="bg-gray-900 border shadow-sm p-2 rounded-full">
                      <Moon className="h-6 w-6 text-blue-400" />
                    </div>
                    <span className="font-medium dark:text-gray-200">Dark</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="dark:text-gray-200">Accent Color</Label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {colorOptions.map((color) => (
                    <TooltipProvider key={color.name}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            className={cn(
                              "h-12 w-full rounded-md border-2 flex items-center justify-center transition-all",
                              color.value,
                              accentColor === color.name
                                ? "border-black dark:border-white scale-105"
                                : "border-transparent hover:scale-105",
                            )}
                            onClick={() => handleAccentColorChange(color.name)}
                          >
                            {accentColor === color.name && <Check className={cn("h-6 w-6", color.textColor)} />}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="capitalize">{color.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}

                  {/* Custom color option */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className={cn(
                            "h-12 w-full rounded-md border-2 flex items-center justify-center transition-all relative overflow-hidden",
                            accentColor === "custom"
                              ? "border-black dark:border-white scale-105"
                              : "border-transparent hover:scale-105",
                          )}
                          onClick={() => handleAccentColorChange("custom")}
                          style={{ backgroundColor: customColor }}
                        >
                          {accentColor === "custom" && (
                            <Check className={cn("h-6 w-6", isColorLight(customColor) ? "text-black" : "text-white")} />
                          )}
                          <Paintbrush className="h-5 w-5 absolute top-1 right-1 text-white drop-shadow-md" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Custom</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Select an accent color to personalize your dashboard experience.
                </p>
              </div>

              {/* Custom Color Picker Section */}
              {accentColor === "custom" && (
                <div className="space-y-3 p-4 border rounded-lg dark:border-gray-700">
                  <Label className="text-base dark:text-gray-200">Custom Color</Label>
                  <ColorPicker onColorChange={handleCustomColorChange} />
                </div>
              )}

              <div className="space-y-2">
                <Label className="dark:text-gray-200">Font Size</Label>
                <Select defaultValue="medium">
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                    <SelectValue placeholder="Select font size" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base dark:text-gray-200">Reduced Motion</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Reduce the amount of animation and motion effects.
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
              {saveError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{saveError}</AlertDescription>
                </Alert>
              )}

              {showSavedMessage && (
                <p className="text-green-600 dark:text-green-400 flex items-center">
                  <Check className="h-4 w-4 mr-1" /> Theme preferences saved
                </p>
              )}
              <div className="ml-auto">
                <Button
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={saveThemePreferences}
                >
                  Save Preferences
                </Button>
              </div>
            </CardFooter>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-white">Theme Preview</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Preview how your selected theme will look.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg dark:border-gray-700">
                  <h3 className="text-lg font-medium mb-2 dark:text-gray-200">UI Components</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Button className="w-full">Primary Button</Button>
                      <Button variant="outline" className="w-full dark:border-gray-600 dark:text-gray-200">
                        Secondary Button
                      </Button>
                      <Button variant="ghost" className="w-full dark:text-gray-200">
                        Ghost Button
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div className="p-3 bg-card border rounded-md dark:bg-gray-700 dark:border-gray-600">
                        <p className="text-sm dark:text-gray-200">Card Component</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch id="preview-switch" />
                        <Label htmlFor="preview-switch" className="dark:text-gray-200">
                          Toggle Switch
                        </Label>
                      </div>
                      <div className="flex gap-2">
                        <Badge>Default</Badge>
                        <Badge variant="outline" className="dark:border-gray-600 dark:text-gray-200">
                          Outline
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Settings */}
        <TabsContent value="integrations" className="space-y-4">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-white">Connected Services</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Manage third-party services connected to your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                      <svg
                        className="h-6 w-6 text-blue-600 dark:text-blue-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium dark:text-gray-200">Facebook</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Connected on Aug 12, 2023</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="text-red-500 dark:border-gray-600">
                    Disconnect
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                      <svg
                        className="h-6 w-6 text-blue-600 dark:text-blue-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium dark:text-gray-200">Twitter</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Connected on Jul 28, 2023</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="text-red-500 dark:border-gray-600">
                    Disconnect
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700">
                  <div className="flex items-center gap-4">
                    <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-full">
                      <svg
                        className="h-6 w-6 text-black dark:text-gray-300"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium dark:text-gray-200">GitHub</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Not connected</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-200">
                    Connect
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                      <svg
                        className="h-6 w-6 text-blue-600 dark:text-blue-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium dark:text-gray-200">LinkedIn</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Not connected</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-200">
                    Connect
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-white">API Access</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Manage API keys and access tokens for developers.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="dark:text-gray-200">API Keys</Label>
                <div className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700">
                  <div>
                    <p className="font-medium dark:text-gray-200">Primary API Key</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Created on Aug 1, 2023</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-200">
                      <Key className="h-4 w-4 mr-1" /> View Key
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-500 dark:border-gray-600">
                      Revoke
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="dark:text-gray-200">Webhooks</Label>
                <div className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700">
                  <div>
                    <p className="font-medium dark:text-gray-200">Event Notifications</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">https://example.com/webhook</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-200">
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-500 dark:border-gray-600">
                      Delete
                    </Button>
                  </div>
                </div>
              </div>

              <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4" /> Create New API Key
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}
