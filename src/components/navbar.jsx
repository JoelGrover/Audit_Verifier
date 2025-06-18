import { Button } from "@/components/ui/button"
import { Shield } from "lucide-react"
import Link from "next/link"

export default function Navbar() {
  return (
    <nav className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <span className="font-bold text-xl text-gray-900">AuditVerify</span>
            </Link>
          </div>
          <Button asChild>
            <Link href="/files">Get Started</Link>
          </Button>
        </div>
      </div>
    </nav>
  )
}
