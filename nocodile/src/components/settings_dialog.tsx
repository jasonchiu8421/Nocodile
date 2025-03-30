import { useState } from "react"
import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useSettingsStore } from "@/store/useSettingsStore"
import { toast } from "sonner"

export function SettingsDialog() {
  const { serverUrl, setServerUrl } = useSettingsStore()
  const [inputUrl, setInputUrl] = useState(serverUrl)

  const handleSave = () => {
    // Basic URL validation
    try {
      // Attempt to create a URL object to validate the input
      new URL(inputUrl)
      setServerUrl(inputUrl)
      toast.success("Server URL updated successfully")
    } catch (error) {
      toast.error("Invalid URL format. Please enter a valid URL")
    }
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="h-4 w-4" />
          <span className="sr-only">Open settings</span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
          <SheetDescription>
            Configure application settings. Changes are applied immediately.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 p-4">
          <div className="grid gap-2">
            <Label htmlFor="server-url">Server URL</Label>
            <Input
              id="server-url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="http://localhost:8888"
            />
            <p className="text-xs text-muted-foreground">
              Enter the URL of your Nocodile server including the protocol (http:// or https://)
            </p>
          </div>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button onClick={handleSave}>Save changes</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
