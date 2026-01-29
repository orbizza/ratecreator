"use client";

import Link from "next/link";
import {
  ChevronRight,
  Shield,
  MessageSquare,
  Users,
  BarChart3,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@ratecreator/ui";

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">
                C
              </span>
            </div>
            <span className="text-xl font-bold">Creator Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="container relative mx-auto px-4 py-24 sm:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center rounded-full border bg-muted/50 px-4 py-1.5 text-sm">
              <span className="mr-2">🎉</span>
              <span className="text-muted-foreground">
                Now available for all creators
              </span>
              <ChevronRight className="ml-1 h-4 w-4" />
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Take Control of Your{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Creator Profile
              </span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Claim ownership of your accounts, respond to reviews, and manage
              your online reputation across all major platforms.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/sign-up">
                <Button size="lg" className="gap-2">
                  Start for Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button size="lg" variant="outline">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/30">
        <div className="container mx-auto px-4 py-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="text-3xl font-bold sm:text-4xl">50K+</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Creator Profiles
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold sm:text-4xl">6</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Platforms Supported
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold sm:text-4xl">10K+</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Reviews Written
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold sm:text-4xl">500+</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Claimed Accounts
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything You Need to Manage Your Presence
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Powerful tools designed specifically for content creators to manage
            their online reputation.
          </p>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="group relative rounded-2xl border bg-background p-8 transition-all hover:border-primary/50 hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Claim Your Profiles</h3>
            <p className="text-muted-foreground">
              Verify ownership of your creator accounts across YouTube, Twitter,
              Instagram, TikTok, Reddit, and Twitch.
            </p>
          </div>
          <div className="group relative rounded-2xl border bg-background p-8 transition-all hover:border-primary/50 hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Respond to Reviews</h3>
            <p className="text-muted-foreground">
              Engage directly with your audience by responding to reviews and
              addressing feedback professionally.
            </p>
          </div>
          <div className="group relative rounded-2xl border bg-background p-8 transition-all hover:border-primary/50 hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Team Collaboration</h3>
            <p className="text-muted-foreground">
              Invite team members, set permissions, and collaborate on managing
              your creator brand together.
            </p>
          </div>
          <div className="group relative rounded-2xl border bg-background p-8 transition-all hover:border-primary/50 hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Analytics Dashboard</h3>
            <p className="text-muted-foreground">
              Track your ratings, review trends, and audience sentiment with
              detailed analytics and insights.
            </p>
          </div>
          <div className="group relative rounded-2xl border bg-background p-8 transition-all hover:border-primary/50 hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CheckCircle className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-semibold">Verified Badge</h3>
            <p className="text-muted-foreground">
              Get a verified badge on your profile to show your audience that
              your account is authentic.
            </p>
          </div>
          <div className="group relative rounded-2xl border bg-background p-8 transition-all hover:border-primary/50 hover:shadow-lg">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-6 w-6"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <h3 className="mb-2 text-xl font-semibold">Multi-Platform</h3>
            <p className="text-muted-foreground">
              Manage all your social accounts from a single dashboard. One place
              for YouTube, Twitter, TikTok, and more.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="border-y bg-muted/30 py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Get Started in Minutes
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Claiming your creator profile is quick and easy.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-4xl">
            <div className="grid gap-8 md:grid-cols-3">
              <div className="relative text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  1
                </div>
                <h3 className="mb-2 text-lg font-semibold">Create Account</h3>
                <p className="text-sm text-muted-foreground">
                  Sign up with your email or social account in seconds.
                </p>
              </div>
              <div className="relative text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  2
                </div>
                <h3 className="mb-2 text-lg font-semibold">
                  Find Your Profile
                </h3>
                <p className="text-sm text-muted-foreground">
                  Search for your creator profile on Rate Creator.
                </p>
              </div>
              <div className="relative text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  3
                </div>
                <h3 className="mb-2 text-lg font-semibold">Verify & Claim</h3>
                <p className="text-sm text-muted-foreground">
                  Complete verification to claim ownership of your profile.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="mx-auto max-w-3xl rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8 text-center sm:p-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to Take Control?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Join thousands of creators who trust Rate Creator to manage their
            online presence.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/sign-up">
              <Button size="lg" className="gap-2">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
                <span className="text-sm font-bold text-primary-foreground">
                  C
                </span>
              </div>
              <span className="font-semibold">Creator Portal</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Rate Creator. All rights
              reserved.
            </p>
            <div className="flex gap-4">
              <Link
                href="/privacy"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
