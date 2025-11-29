import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Palette, FileCode, BookOpen } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <main className="flex max-w-4xl flex-col items-center gap-8 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            <span className="text-primary-600">Orca</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Orthodontic Practice Management System
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="text-left">
            <CardHeader>
              <Palette className="h-8 w-8 text-primary-600" />
              <CardTitle className="text-lg">UI Showcase</CardTitle>
              <CardDescription>
                Explore all available UI components and design tokens
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/ui-showcase">
                <Button className="w-full">
                  View Components
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="text-left">
            <CardHeader>
              <FileCode className="h-8 w-8 text-secondary-600" />
              <CardTitle className="text-lg">Tech Stack</CardTitle>
              <CardDescription>
                Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card className="text-left">
            <CardHeader>
              <BookOpen className="h-8 w-8 text-success-600" />
              <CardTitle className="text-lg">Documentation</CardTitle>
              <CardDescription>
                Guides, patterns, and best practices for development
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        <p className="text-sm text-muted-foreground">
          Project Status: <span className="font-medium">Foundation Setup</span>
        </p>
      </main>
    </div>
  );
}
