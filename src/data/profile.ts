import { nf } from "./icons";

export const GITHUB_USER = "Drack112";
export const LASTFM_USER = "Drack112";

export const profile = {
  name: "João Vitor",
  handle: "drack112",
  headline: "Backend Engineer",
  focus: ["Go", "Node.js", "Python", "AWS", "GCP"],
  specialties:
    "Distributed Systems, Scalable Architectures & Cloud-Native APIs",
  domains: [
    { name: "Fintech", icon: nf.money },
    { name: "Healthtech", icon: nf.heartbeat },
    { name: "Logistics", icon: nf.truck },
  ],
  location: "São Paulo, Brazil",
  status:
    "Open to backend engineering roles (mid-to-senior) where the technical challenges are real.",
  about: [
    "In 3 years of backend engineering, I've shipped production systems under real constraints — not side projects.",
    "High-volume data pipelines. Payment-critical APIs. Real-time hospital logistics. KYC systems with biometric validation. These are the kinds of problems I've been hired to solve.",
  ],
  beyondCode:
    "I care about system observability, architectural trade-offs, and full ownership of what I build — from design decisions to production monitoring. I don't just close tickets; I think about why the system needs to work this way.",
  fan: "Off the clock I'm a huge tokusatsu fan — Kamen Rider Black above all. That's where this site's retro TV and cookie spy come from.",
  links: {
    github: "https://github.com/Drack112",
    linkedin: "https://www.linkedin.com/in/joao-vitor-backend/",
    lastfm: "https://www.last.fm/user/Drack112",
  },
};

export interface Experience {
  id: string;
  company: string;
  role: string;
  start: string; // YYYY-MM
  end: string | null; // null = current
  place: string;
  mode: string;
  domain: string;
  icon: string;
  color: string;
  summary?: string;
  highlights: string[];
  stack: string[];
}

// newest first
export const experience: Experience[] = [
  {
    id: "omni-2026",
    company: "Omni Saúde App",
    role: "Software Engineer",
    start: "2026-06",
    end: null,
    place: "São Paulo, Brazil",
    mode: "Hybrid",
    domain: "Healthtech",
    icon: nf.heartbeat,
    color: "#CB6E1B",
    highlights: [],
    stack: [],
  },
  {
    id: "legitimuz",
    company: "Legitimuz",
    role: "Backend Engineer",
    start: "2025-04",
    end: "2026-04",
    place: "São Paulo, Brazil",
    mode: "On-site",
    domain: "Identity & fraud prevention",
    icon: nf.user,
    color: "#A9DC88",
    summary:
      "Backend infrastructure for identity verification and fraud prevention at scale.",
    highlights: [
      "Built high-performance web scraping pipelines in Go and Python for large-scale Big Data collection and processing from public databases, focused on data integrity and pipeline reliability.",
      "Developed KYC (Know Your Customer) systems integrating biometric validation and automated document analysis, reducing manual verification overhead.",
      "Designed and maintained backend services with a focus on observability, fault tolerance and horizontal scalability.",
      "Worked within a cloud-native architecture on AWS, applying best practices for distributed systems and data processing workflows.",
    ],
    stack: [
      "Go",
      "Python",
      "Node.js",
      "AWS",
      "PostgreSQL",
      "MongoDB",
      "Docker",
      "Web Scraping",
      "Big Data",
      "KYC",
      "Biometric Validation",
      "Microservices",
    ],
  },
  {
    id: "omni-2024",
    company: "Omni Saúde App",
    role: "Backend Developer",
    start: "2024-07",
    end: "2025-03",
    place: "São Paulo, Brazil",
    mode: "Hybrid",
    domain: "Healthtech · Fintech",
    icon: nf.heartbeat,
    color: "#CB6E1B",
    summary:
      "Backend for a digital health plan platform focused on the scalability and reliability of critical medical services.",
    highlights: [
      "Built and maintained scalable REST APIs for user management, health plan workflows and medical record handling.",
      "Integrated multiple payment gateways with secure, compliant and fault-tolerant transaction processing.",
      "Developed AI-powered services for automated medical document analysis, cutting processing time for insurance and clinical workflows.",
      "Delivered APIs with full automated test coverage (unit + integration).",
      "Focused on backend security, scalability and clean architecture principles.",
    ],
    stack: [
      "Node.js",
      "TypeScript",
      "NestJS",
      "Python",
      "PostgreSQL",
      "REST APIs",
      "Automated Testing",
      "Payment Gateways",
      "AI Services",
      "Custom GPTs",
      "Docker",
      "Microservices",
    ],
  },
  {
    id: "artico",
    company: "Grupo Ártico",
    role: "Back End Developer",
    start: "2023-03",
    end: "2024-04",
    place: "São Paulo, Brazil",
    mode: "Hybrid",
    domain: "Healthtech · Logistics",
    icon: nf.truck,
    color: "#FEF274",
    summary:
      "Backend architecture for a real-time hospital logistics and patient flow management platform.",
    highlights: [
      "Architected real-time messaging infrastructure with Node.js, TypeScript, WebSockets and Redis, syncing patient flow data live across hospital departments.",
      "Designed hospital logistics systems: patient intake, transport coordination and internment management, built for time-sensitive healthcare environments.",
      "Applied event-driven architecture to decouple services and scale under variable hospital load.",
      "Took part in system design decisions and owned critical backend modules end-to-end.",
    ],
    stack: [
      "Node.js",
      "TypeScript",
      "WebSockets",
      "Redis",
      "REST APIs",
      "Event-Driven Architecture",
      "PostgreSQL",
      "Docker",
    ],
  },
];

export interface StackGroup {
  label: string;
  icon: string;
  items: string[];
}

// LinkedIn stack + what the GitHub repos actually use
export const stack: StackGroup[] = [
  {
    label: "languages",
    icon: nf.code,
    items: ["Go", "TypeScript", "JavaScript", "Python", "Java", "Dart"],
  },
  {
    label: "backend",
    icon: nf.server,
    items: [
      "Node.js",
      "NestJS",
      "Express",
      "Fastify",
      "AdonisJS",
      "FastAPI",
      "Django",
      "Flask",
      "Gin",
      "Spring Boot",
      "Bun",
    ],
  },
  {
    label: "architecture",
    icon: nf.sparkle,
    items: [
      "Microservices",
      "Event-Driven",
      "DDD",
      "Clean Architecture",
      "Hexagonal",
      "Distributed Systems",
    ],
  },
  {
    label: "apis",
    icon: nf.exchange,
    items: ["REST", "GraphQL", "gRPC", "WebSockets", "Socket.io", "WebRTC"],
  },
  {
    label: "messaging",
    icon: nf.bell,
    items: ["Kafka", "RabbitMQ", "Redis Pub/Sub"],
  },
  {
    label: "databases",
    icon: nf.database,
    items: [
      "PostgreSQL",
      "MongoDB",
      "Redis",
      "MySQL",
      "MariaDB",
      "Elasticsearch",
      "SQLite",
      "Turso",
    ],
  },
  {
    label: "orms",
    icon: nf.table,
    items: ["Prisma", "Drizzle", "TypeORM", "Mongoose", "SQLAlchemy"],
  },
  {
    label: "ai",
    icon: nf.robot,
    items: [
      "OpenAI",
      "Anthropic",
      "LangChain",
      "Ollama",
      "Custom GPTs",
      "Google Vision",
    ],
  },
  {
    label: "cloud",
    icon: nf.cloud,
    items: ["AWS", "GCP", "Serverless", "Firebase", "Vercel"],
  },
  {
    label: "devops",
    icon: nf.docker,
    items: [
      "Docker",
      "CI/CD",
      "GitHub Actions",
      "CircleCI",
      "Traefik",
      "Nginx",
      "SonarCloud",
    ],
  },
  {
    label: "observability",
    icon: nf.chart,
    items: ["OpenTelemetry", "Prometheus", "Grafana", "Zipkin"],
  },
  {
    label: "frontend",
    icon: nf.window,
    items: ["React", "Next.js", "Vue", "Nuxt", "Tailwind", "Expo", "Flutter"],
  },
  {
    label: "testing",
    icon: nf.flask,
    items: ["Jest", "Vitest", "Pytest", "Turborepo", "Nx", "pnpm"],
  },
  {
    label: "setup",
    icon: nf.tux,
    items: [
      "macOS",
      "Arch",
      "Fedora",
      "Gentoo",
      "Solus",
      "Vim",
      "ZMK Skeletyl",
    ],
  },
];

// repos shown first on the GitHub memory card, with a short English blurb
export const featuredRepos: Record<string, string> = {
  "Golang-SimpleBank":
    "Bank API master class with DDD & TDD — Go, Gin, gRPC, PostgreSQL, Redis, Traefik, CI/CD.",
  "Go-Wallpaper": "Wallpaper scraper in Go with Colly.",
  "All-In-One-Music-Graphql":
    "YTMusic, SoundCloud, Last.fm & lyrics in one place — Next.js, GraphQL, Drizzle, Turso, Redis.",
  "Vintage-TUI-Radio": "Terminal radio streaming via ffmpeg — Go + Bubble Tea.",
  "Twitter-Spring-React":
    "Twitter-like microservices — Spring Boot, Eureka, Kafka, RabbitMQ, Prometheus, Grafana, Zipkin.",
  "Track-API":
    "Tracking API with full observability — Go, OpenTelemetry, Prometheus, Grafana, Zipkin.",
  "Car-Check-gRPC":
    "Car rental built on gRPC microservices — NestJS, gRPC, MongoDB.",
  "Namu-Api-Python":
    "API with LLM integrations — FastAPI, SQLAlchemy, Anthropic, Ollama.",
  "Google-Docs-Flutter": "Google Docs remake — Flutter, Socket.io, MongoDB.",
  "Discord-App-Next":
    "Discord clone: API, websocket & WebRTC in one app — Next.js, LiveKit, Prisma, Clerk.",
  "Golang-Hexagonal-Example":
    "Hexagonal architecture in Go with pgx and OpenTelemetry.",
  "OCR-Golang-AI":
    "Text detection and translation with Google Vision AI and Translator AI.",
};
