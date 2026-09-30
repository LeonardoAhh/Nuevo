import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Box, Code2, Globe, Terminal } from "lucide-react"
import { COMPANY_NAME } from "@/lib/constants/company"

export default function LandingPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background text-foreground">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-semibold tracking-tight">
              {COMPANY_NAME}
            </Link>
            <nav className="hidden md:flex gap-6 text-sm text-muted-foreground">
              <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
              <Link href="#templates" className="hover:text-foreground transition-colors">Templates</Link>
              <Link href="#customers" className="hover:text-foreground transition-colors">Customers</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" shape="square" size="nav">
                Log In
              </Button>
            </Link>
            <Link href="/login">
              <Button shape="square" size="nav">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Band with Mesh Gradient */}
        <section className="relative overflow-hidden py-32 sm:py-40">
          <div className="absolute inset-0 z-0">
            {/* Mesh gradient approximation using multiple radial gradients */}
            <div className="absolute top-[-10%] left-[-10%] h-[50%] w-[50%] rounded-full bg-blue-500/20 blur-[100px]" />
            <div className="absolute top-[20%] right-[-10%] h-[60%] w-[40%] rounded-full bg-purple-500/20 blur-[100px]" />
            <div className="absolute bottom-[-20%] left-[20%] h-[50%] w-[60%] rounded-full bg-cyan-500/20 blur-[100px]" />
          </div>
          
          <div className="relative z-10 mx-auto max-w-7xl px-6 text-center">
            <h1 className="mx-auto max-w-4xl text-[48px] font-semibold leading-tight tracking-[-2.4px] md:text-[64px] lg:text-[80px]">
              Develop. Preview. Ship.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Vercel's frontend cloud gives you the developer experience and infrastructure to build, scale, and secure a faster, more personalized web.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button shape="pill" size="marketing" className="w-full sm:w-auto">
                Start Deploying
              </Button>
              <Button variant="outline" shape="pill" size="marketing" className="w-full sm:w-auto">
                Get a Demo
              </Button>
            </div>
          </div>
        </section>

        {/* Logo Strip */}
        <section className="border-y border-border bg-background py-16">
          <div className="mx-auto max-w-7xl px-6 text-center">
            <p className="font-mono text-[12px] font-medium uppercase tracking-widest text-muted-foreground">
              Trusted by the best frontend teams
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-8 opacity-50 grayscale sm:gap-16">
              {/* Fake logos */}
              <div className="text-xl font-bold">Acme Corp</div>
              <div className="text-xl font-bold">GlobalTech</div>
              <div className="text-xl font-bold">NextStart</div>
              <div className="text-xl font-bold">Innovate.io</div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-16">
              <h2 className="font-mono text-[12px] font-medium uppercase tracking-widest text-muted-foreground">
                Features
              </h2>
              <h3 className="mt-2 text-3xl font-semibold tracking-[-1.28px] md:text-4xl">
                Everything you need to build the web.
              </h3>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="flex flex-col rounded-xl">
                <CardContent className="p-8">
                  <Globe className="mb-6 h-8 w-8 text-foreground" />
                  <h4 className="text-xl font-semibold tracking-[-0.4px]">Global Edge Network</h4>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Deploy your content to the edge in milliseconds, ensuring fast load times for everyone.
                  </p>
                </CardContent>
              </Card>
              <Card className="flex flex-col rounded-xl">
                <CardContent className="p-8">
                  <Terminal className="mb-6 h-8 w-8 text-foreground" />
                  <h4 className="text-xl font-semibold tracking-[-0.4px]">Serverless Functions</h4>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Run your backend code securely without managing infrastructure.
                  </p>
                </CardContent>
              </Card>
              <Card className="flex flex-col rounded-xl">
                <CardContent className="p-8">
                  <Box className="mb-6 h-8 w-8 text-foreground" />
                  <h4 className="text-xl font-semibold tracking-[-0.4px]">Framework Agnostic</h4>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Native support for Next.js, Nuxt, SvelteKit, and 30+ other frameworks.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Code Editor Band */}
        <section className="border-t border-border bg-background py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <h2 className="font-mono text-[12px] font-medium uppercase tracking-widest text-muted-foreground">
                  Developer Experience
                </h2>
                <h3 className="mt-2 text-3xl font-semibold tracking-[-1.28px] md:text-4xl">
                  Write code. Push to main. <br className="hidden sm:block" /> We handle the rest.
                </h3>
                <p className="mt-4 text-lg text-muted-foreground">
                  Our Git integrations automatically deploy your commits. Preview every change before it goes live with unique preview URLs.
                </p>
                <div className="mt-8">
                  <Button variant="link" className="p-0 text-base" shape="square">
                    Explore docs <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-2 border-b border-border pb-4">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <div className="ml-2 flex items-center gap-2 font-mono text-sm text-muted-foreground">
                    <Code2 className="h-4 w-4" /> index.js
                  </div>
                </div>
                <pre className="mt-4 overflow-x-auto font-mono text-sm leading-relaxed text-foreground">
                  <code>{`export default function App() {
  return (
    <main>
      <h1>Hello, World!</h1>
      <p>Deployed with Vercel.</p>
    </main>
  )
}`}</code>
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Band */}
        <section className="border-t border-border bg-background py-24 sm:py-32 text-center">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-[40px] font-semibold tracking-[-1.28px] md:text-[48px]">
              Ready to deploy?
            </h2>
            <p className="mt-4 text-xl text-muted-foreground">
              Start building with a free account. Get access to custom domains, automatic HTTPS, and global edge routing.
            </p>
            <div className="mt-10">
              <Button shape="pill" size="marketing">
                Start Deploying
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-12">
        <div className="mx-auto max-w-7xl px-6 md:flex md:items-center md:justify-between">
          <div className="flex justify-center md:justify-start">
            <span className="font-semibold">{COMPANY_NAME}</span>
          </div>
          <div className="mt-8 md:mt-0 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-foreground">Frameworks</Link>
            <Link href="#" className="hover:text-foreground">Pricing</Link>
            <Link href="#" className="hover:text-foreground">Privacy</Link>
            <Link href="#" className="hover:text-foreground">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
