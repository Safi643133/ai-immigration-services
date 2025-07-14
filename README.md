# AI Immigration Agent

An AI-powered application that automatically parses documents and fills immigration forms using LangChain, LangGraph, and Next.js.

## Features

- 🔐 Google OAuth Authentication
- 📄 Multi-document upload and processing
- 🤖 AI-powered document parsing and data extraction
- 📋 Automatic form filling with validation
- 👥 Role-based access (Applicant, Lawyer, Admin)
- 📊 Real-time processing status and progress tracking

## Tech Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with Google OAuth
- **AI/ML**: LangChain, LangGraph, OpenAI
- **File Storage**: Supabase Storage (or AWS S3)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- OpenAI API key (for AI features)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-immigration-agent
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Fill in your environment variables:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
```

### Database Setup

1. Create a new Supabase project
2. Run the SQL commands from `supabase-setup.sql` in your Supabase SQL editor
3. Configure Google OAuth in Supabase Auth settings
4. Set up Row Level Security (RLS) policies

### Running the Application

1. Start the development server:
```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication routes
│   ├── dashboard/         # Dashboard pages
│   ├── login/             # Login page
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
├── contexts/              # React contexts
├── lib/                   # Utility functions
│   ├── supabase.ts        # Supabase client
│   ├── auth.ts            # Auth utilities
│   └── ai/                # AI/ML utilities
└── types/                 # TypeScript types
```

## Database Schema

### Core Tables

- `user_profiles` - Extended user information
- `documents` - Uploaded document metadata
- `processing_sessions` - Document processing sessions
- `extracted_data` - AI-extracted information
- `form_templates` - Form definitions
- `form_submissions` - Completed form submissions

### User Roles

- `applicant` - End users uploading documents
- `lawyer` - Legal professionals managing cases
- `admin` - System administrators

## API Endpoints

### Authentication
- `POST /api/auth/login` - Google OAuth login
- `POST /api/auth/logout` - User logout

### Documents
- `POST /api/documents/upload` - Upload documents
- `GET /api/documents/{id}/status` - Get processing status
- `GET /api/documents/{id}/results` - Get extraction results

### Forms
- `GET /api/forms/templates` - Get available form templates
- `POST /api/forms/auto-fill` - Auto-fill form with extracted data
- `POST /api/forms/{id}/generate` - Generate completed form

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
