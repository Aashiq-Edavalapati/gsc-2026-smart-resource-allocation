import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-background font-sans text-foreground overflow-x-hidden selection:bg-primary/20">
      
      <!-- Navbar -->
      <nav class="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div class="container mx-auto px-4 h-16 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/></svg>
            </div>
            <span class="font-bold text-xl tracking-tight hidden sm:block">Smart Resource Allocation</span>
            <span class="font-bold text-xl tracking-tight sm:hidden">SRA</span>
          </div>
          <div class="flex items-center gap-4">
            <a routerLink="/login" class="text-sm font-medium hover:text-primary transition-colors">Sign In</a>
            <a routerLink="/login" class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
              Get Started
            </a>
          </div>
        </div>
      </nav>

      <!-- Hero Section -->
      <main>
        <section class="py-24 md:py-32 lg:py-40 flex items-center justify-center text-center px-4 relative overflow-hidden">
          <!-- Background decorative elements -->
          <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/20 blur-[100px] rounded-full -z-10"></div>
          
          <div class="max-w-[800px] space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground">
              Google Solution Challenge 2026
            </div>
            <h1 class="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight">
              Empowering NGOs with <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">AI-Driven Insights</span>
            </h1>
            <p class="text-xl text-muted-foreground md:text-2xl leading-relaxed max-w-[600px] mx-auto">
              Revolutionizing how field workers report issues and how organizations deploy resources, using advanced AI and real-time mapping.
            </p>
            <div class="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <a routerLink="/login" class="inline-flex items-center justify-center rounded-lg text-base font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-12 px-8 w-full sm:w-auto">
                Join the Platform
              </a>
              <a href="#features" class="inline-flex items-center justify-center rounded-lg text-base font-medium transition-colors border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-12 px-8 w-full sm:w-auto">
                Explore Features
              </a>
            </div>
          </div>
        </section>

        <!-- Features Grid -->
        <section id="features" class="py-24 bg-muted/50 border-t">
          <div class="container mx-auto px-4">
            <div class="text-center mb-16 space-y-4">
              <h2 class="text-3xl md:text-4xl font-bold tracking-tight">Everything you need to scale impact</h2>
              <p class="text-muted-foreground text-lg max-w-[600px] mx-auto">Our platform bridges the gap between field observations and organizational action.</p>
            </div>

            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <!-- Feature 1 -->
              <div class="rounded-xl border bg-card text-card-foreground shadow-sm p-8 hover:shadow-md transition-shadow">
                <div class="w-12 h-12 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <h3 class="font-semibold text-xl mb-3">AI Field Reporting</h3>
                <p class="text-muted-foreground leading-relaxed">
                  Field workers can upload voice notes and images. Our AI automatically transcibes, translates, and extracts actionable issues and tasks.
                </p>
              </div>

              <!-- Feature 2 -->
              <div class="rounded-xl border bg-card text-card-foreground shadow-sm p-8 hover:shadow-md transition-shadow">
                <div class="w-12 h-12 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/></svg>
                </div>
                <h3 class="font-semibold text-xl mb-3">Organization Dashboards</h3>
                <p class="text-muted-foreground leading-relaxed">
                  NGOs get a powerful dashboard to manage verified field reports, track team members, and assign resources effectively.
                </p>
              </div>

              <!-- Feature 3 -->
              <div class="rounded-xl border bg-card text-card-foreground shadow-sm p-8 hover:shadow-md transition-shadow">
                <div class="w-12 h-12 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </div>
                <h3 class="font-semibold text-xl mb-3">Trust Scoring</h3>
                <p class="text-muted-foreground leading-relaxed">
                  A built-in reputation system ensures that verified NGOs and reliable volunteers are prioritized in the network.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer class="border-t py-12 bg-background">
        <div class="container mx-auto px-4 text-center text-muted-foreground">
          <p class="text-sm font-medium">Built for Google Solution Challenge 2026</p>
        </div>
      </footer>
    </div>
  `
})
export class LandingComponent {
}
