import { Button } from "@/components/ui/button";
import { Shield, CheckCircle, Users, FileText, ArrowRight, Workflow, Zap, DownloadCloud } from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/navbar";
import { Card, CardContent } from "@/components/ui/card";

export default function HeroPage() {
  const features = [
    {
      icon: Shield,
      title: "Data-Safe Editing",
      description: "Make updates confidently with secure, structured record handling.",
    },
    {
      icon: CheckCircle,
      title: "Fast Search",
      description: "Find what you need instantly with lightning-fast data querying.",
    },
    {
      icon: Users,
      title: "Streamlined UI for Teams",
      description: "Clean, clutter-free interface that feels better than Excel.",
    },
    {
      icon: FileText,
      title: "One-Click Downloads",
      description: "Export large datasets in Excel — fast, simple, and frustration-free.",
    },
  ];

  const steps = [
    {
      icon: Workflow,
      title: "Import Your Data",
      description: "Drag & drop your Excel files or connect with your data pipeline.",
    },
    {
      icon: Zap,
      title: "Edit & Search Instantly",
      description: "Quickly update records and find anything in milliseconds.",
    },
    {
      icon: DownloadCloud,
      title: "Export & Share",
      description: "Download clean reports and share with your team effortlessly.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <section className="relative flex items-center justify-center min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="absolute inset-0 opacity-10 bg-[url('/grid.svg')] bg-center bg-cover pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">

          <p className="text-blue-600 font-semibold uppercase tracking-wide mb-4">
            Built for modern teams who hate messy Excel workflows
          </p>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Audit Smarter, Not Harder — <span className="text-blue-600">No More Excel Struggles</span>
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Ditch the chaos of spreadsheets. Our tool makes audit data easy to manage — search faster, edit effortlessly, and export clean reports in seconds. No fluff, just speed and simplicity your team will love.
          </p>

          <div className="flex justify-center gap-4 flex-wrap mb-10">
            <Button size="lg" className="px-8 py-3 text-lg" asChild>
              <Link href="/files">
                Start For Free <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>



          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-gray-600 text-sm">
            <div className="flex items-center justify-center gap-2">
              🔐 Structured data editing
            </div>

            <div className="flex items-center justify-center gap-2">
              ⚡ Instant Excel export
            </div>
            <div className="flex items-center justify-center gap-2">
              🔍 Superfast search
            </div>
            <div className="flex items-center justify-center gap-2">
              💻 Built for teams
            </div>
          </div>
        </div>
      </section>


      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-10">How It Works</h2>
          <div className="grid sm:grid-cols-3 gap-10">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <step.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-800 mb-2">{step.title}</h4>
                <p className="text-gray-600 text-sm max-w-xs">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need for modern auditing</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to make your audit process easy from start to finish
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
