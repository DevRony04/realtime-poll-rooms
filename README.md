# Real-Time Poll Rooms

A full-stack web application for creating and sharing polls with real-time vote updates. Built with Next.js 14, TypeScript, PostgreSQL, and Pusher.

## Screenshot


![alt text](<Screenshot 2026-02-17 132223.png>)


## Features

- Create polls with custom questions and multiple options
- Generate shareable poll links
- Real-time vote updates using WebSockets (Pusher)
- Anti-abuse voting mechanisms
- Persistent data storage with PostgreSQL
- Responsive UI with Tailwind CSS
- **Liquid Motion UI**: "Lava Lamp" visualizations and floating organic elements
- SEO-optimized with Next.js 14

## Anti-Abuse Mechanisms

### Mechanism #1: IP-Based Rate Limiting
**What it prevents:** Multiple votes from the same network/device
**How it works:** 
- Extracts client IP address from request headers (x-forwarded-for, x-real-ip)
- Stores IP address with each vote
- Before accepting a vote, checks if that IP has already voted on the poll
- Returns 409 Conflict if duplicate IP detected

**Limitations:**
- Can be bypassed using VPNs or proxy servers
- Multiple users behind the same NAT/router share the same public IP
- IP addresses can change (dynamic IPs)

### Mechanism #2: Browser Fingerprinting
**What it prevents:** Repeat voting from the same browser/device
**How it works:**
- Uses FingerprintJS library to generate unique browser fingerprint
- Fingerprint based on: browser type, OS, screen resolution, installed fonts, canvas rendering, etc.
- Stores fingerprint hash with each vote
- Checks for duplicate fingerprints before accepting votes

**Limitations:**
- Can be bypassed by clearing browser data or using incognito mode
- Different browsers on same device have different fingerprints
- Fingerprints can change after browser updates
- Privacy-focused users may block fingerprinting APIs

### Combined Approach
By using BOTH mechanisms, we make it significantly harder to abuse the voting system. An attacker would need to bypass both IP tracking AND browser fingerprinting, which requires more sophisticated techniques than casual abuse attempts.

**Additional protection stored:**
- User-Agent strings (for potential pattern detection)
- Vote timestamps (for rate limiting analysis)
- Database indexes on IP and fingerprint for fast duplicate detection

## Tech Stack

### Frontend
- **Next.js 14** (App Router) - React framework with SSR/SSG
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Reusable component library
- **Pusher Client** - Real-time WebSocket client
- **FingerprintJS** - Browser fingerprinting

### Backend
- **Next.js API Routes** - RESTful API endpoints
- **Prisma ORM** - Type-safe database access
- **PostgreSQL** - Relational database
- **Pusher** - Managed WebSocket service

### Deployment
- **Vercel** - Next.js hosting
- **Supabase** (recommended) or **Vercel Postgres** - PostgreSQL hosting with real-time capabilities

## Project Structure

```
realtime-poll-rooms/
├── app/
│   ├── api/
│   │   └── polls/
│   │       ├── route.ts                    # POST /api/polls - Create poll
│   │       └── [pollId]/
│   │           ├── route.ts                # GET /api/polls/:id - Get poll
│   │           └── vote/
│   │               └── route.ts            # POST /api/polls/:id/vote - Submit vote
│   ├── poll/
│   │   └── [pollId]/
│   │       └── page.tsx                    # Poll viewing page
│   ├── layout.tsx                          # Root layout with metadata
│   ├── page.tsx                            # Home page (poll creation)
│   └── globals.css                         # Global styles
├── components/
│   └── ui/                                 # Reusable UI components
├── lib/
│   ├── db.ts                               # PostgreSQL client (pg library)
│   ├── supabase.ts                         # Supabase client config (optional)
│   ├── pusher-server.ts                    # Pusher server config
│   ├── pusher-client.ts                    # Pusher client config
│   └── utils.ts                            # Utility functions
├── prisma/
│   └── schema.prisma                       # Database schema
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## Database Schema

### Poll Table
- `id` (UUID, PK) - Unique poll identifier
- `question` (String) - Poll question
- `createdAt` (DateTime) - Creation timestamp
- `updatedAt` (DateTime) - Last update timestamp

### Option Table
- `id` (UUID, PK) - Unique option identifier
- `text` (String) - Option text
- `pollId` (UUID, FK) - Reference to poll
- `position` (Int) - Display order

### Vote Table
- `id` (UUID, PK) - Unique vote identifier
- `pollId` (UUID, FK) - Reference to poll
- `optionId` (UUID, FK) - Reference to option
- `ipAddress` (String, nullable) - Voter IP (anti-abuse #1)
- `fingerprint` (String, nullable) - Browser fingerprint (anti-abuse #2)
- `userAgent` (String, nullable) - User agent string
- `createdAt` (DateTime) - Vote timestamp

**Indexes:**
- `pollId` - Fast poll lookups
- `optionId` - Fast vote counting
- `(ipAddress, pollId)` - Duplicate IP detection
- `(fingerprint, pollId)` - Duplicate fingerprint detection

## Setup Instructions

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (local or cloud)
- Pusher account (free tier available)

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd realtime-poll-rooms
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env` file in the root directory:

```env
# Database - Choose one option:

# Option 1: Direct PostgreSQL (any provider)
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"

# Option 2: Supabase (recommended - includes real-time features)
# Get from https://app.supabase.com > Project Settings > API
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"  # Optional, for admin operations

# Get from Project Settings > Database > Connection String
# Note: Supabase Postgres requires SSL.
# If you include `sslmode`, prefer `sslmode=verify-full` to avoid warnings.
# IMPORTANT (Windows / IPv4-only networks): `db.<ref>.supabase.co` can be IPv6-only. If you get `getaddrinfo ENOTFOUND`,
# use the "Connection pooling" hostname from Supabase (Settings > Database > Connection pooling) instead.
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres?sslmode=verify-full"

# Pusher - Get from pusher.com (free account)
NEXT_PUBLIC_PUSHER_APP_KEY="your_pusher_key"
PUSHER_APP_ID="your_pusher_app_id"
PUSHER_SECRET="your_pusher_secret"
NEXT_PUBLIC_PUSHER_CLUSTER="your_cluster" # e.g., "ap2" for Asia Pacific

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000" # Change in production
```

### 4. Set up Pusher
1. Create account at [pusher.com](https://pusher.com)
2. Create a new Channels app
3. Copy credentials to `.env`

### 5. Set up PostgreSQL

**Option A: Supabase** (Recommended - includes real-time features)

1. **Create a Supabase project**
   - Go to [supabase.com](https://supabase.com) and sign up/login
   - Click "New Project"
   - Choose your organization, enter project name and database password
   - Select a region close to your users
   - Wait for project to be provisioned (~2 minutes)

2. **Get your credentials**
   - Go to Project Settings (gear icon) > API
   - Copy the following to your `.env` file:
     - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
     - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (optional, for admin operations)
   - Go to Project Settings > Database
   - Under "Connection string" > "URI", copy the connection string
   - Replace `[YOUR-PASSWORD]` with your database password
   - Add to `.env` as `DATABASE_URL`

3. **Initialize the database schema**
   - Go to SQL Editor in your Supabase dashboard
   - Click "New Query"
   - Copy the contents of `schema.sql` from this project
   - Paste and click "Run"
   - Verify tables were created in Table Editor

4. **Connection Pooling (Optional but recommended for production)**
   - In Project Settings > Database, use the "Connection pooling" string instead
   - This provides better performance under high load
   - Use mode "Transaction" for best compatibility

**Option B: Local PostgreSQL**
```bash
# Install PostgreSQL, then:
createdb pollrooms
psql pollrooms < schema.sql
```

**Option C: Vercel Postgres**
1. Create project on Vercel
2. Add Postgres database from Storage tab
3. Copy connection string to `.env` as `DATABASE_URL`
4. Run the schema:
   ```bash
   # Install Vercel CLI if needed
   npm i -g vercel
   # Connect to your database
   vercel env pull .env.local
   # Run schema (you'll need to execute schema.sql manually via Vercel dashboard)
   ```

### 6. Verify database connection
```bash
# Test that your DATABASE_URL is working
node -e "const {Pool} = require('pg'); const pool = new Pool({connectionString: process.env.DATABASE_URL}); pool.query('SELECT NOW()', (err, res) => {console.log(err ? err : 'Connected!'); pool.end();})"
```

### 7. Run development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## API Documentation

### Create Poll
```http
POST /api/polls
Content-Type: application/json

{
  "question": "What's your favorite programming language?",
  "options": ["JavaScript", "Python", "Go", "Rust"]
}

Response: 201 Created
{
  "id": "uuid",
  "question": "...",
  "options": [...]
}
```

### Get Poll
```http
GET /api/polls/:pollId

Response: 200 OK
{
  "id": "uuid",
  "question": "...",
  "totalVotes": 42,
  "options": [
    { "id": "uuid", "text": "...", "votes": 15 }
  ]
}
```

### Submit Vote
```http
POST /api/polls/:pollId/vote
Content-Type: application/json

{
  "optionId": "uuid",
  "fingerprint": "browser-fingerprint-hash"
}

Response: 200 OK / 409 Conflict (if already voted)
```

## Deployment

### Deploy to Vercel

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

2. **Import to Vercel**
- Go to [vercel.com](https://vercel.com)
- Import your GitHub repository
- Vercel auto-detects Next.js configuration

3. **Add Environment Variables**
In Vercel dashboard, add all variables from `.env`:
- `DATABASE_URL`
- `NEXT_PUBLIC_PUSHER_APP_KEY`
- `PUSHER_APP_ID`
- `PUSHER_SECRET`
- `NEXT_PUBLIC_PUSHER_CLUSTER`
- `NEXT_PUBLIC_APP_URL` (your Vercel URL)

4. **Set up Database**

**Option A: Supabase (Recommended)**
- Create a Supabase project at [supabase.com](https://supabase.com)
- Run the `schema.sql` in SQL Editor (Project > SQL Editor > New Query)
- Add environment variables in Vercel:
  - `DATABASE_URL` (from Supabase Project Settings > Database > Connection String - use "Connection Pooling" for production)
  - `NEXT_PUBLIC_SUPABASE_URL` (from Project Settings > API)
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (from Project Settings > API)
  - `SUPABASE_SERVICE_ROLE_KEY` (optional, from Project Settings > API)

**Option B: Vercel Postgres**
- Add Vercel Postgres addon from your project's Storage tab
- Copy connection string to environment variables
- Run database schema via Vercel's SQL console or using a migration script

5. **Deploy**
- Vercel automatically builds and deploys
- app is live at `https://realtime-poll-rooms-chi.vercel.app`

## Edge Cases Handled

1. **Empty/Invalid Inputs**
   - Validates question and minimum 2 options
   - Trims whitespace from inputs
   - Returns 400 Bad Request for invalid data

2. **Concurrent Votes**
   - Database transactions ensure vote consistency
   - Race condition handling with unique constraints

3. **Poll Not Found**
   - Returns 404 with user-friendly message
   - Graceful fallback UI

4. **Real-time Connection Issues**
   - Initial data fetch ensures data availability
   - WebSocket auto-reconnection via Pusher
   - Graceful degradation if WebSocket fails

5. **Duplicate Vote Attempts**
   - IP and fingerprint checks before database write
   - Returns 409 Conflict with clear error message

6. **Network Errors**
   - Loading states during API calls
   - Error toast notifications
   - Retry mechanisms for failed requests

7. **Poll Expiration**
   - Prevents voting after expiration time
   - Visual indicators for expired polls
   - Real-time status updates via WebSocket

## Security Considerations

- HTTPS enforced in production
- CORS configured for API routes
- SQL injection prevention via Prisma ORM
- XSS prevention via React's automatic escaping
- Rate limiting via IP tracking
- No sensitive data in client-side code

## Known Limitations & Future Improvements

### Current Limitations
1. **Vote Uniqueness:** Can be bypassed by determined users (VPN + incognito)
2. **Scalability:** Single Pusher channel per poll (limit ~100 concurrent users)
3. **No Authentication:** Anyone can create polls
4. **No Poll Management:** Can't edit or delete polls after creation
5. **No Analytics:** Limited voting pattern analysis

### Future Improvements
- [ ] User authentication (optional poll creator accounts)
- [ ] Poll expiration dates
- [ ] Poll editing and deletion
- [ ] Advanced analytics dashboard
- [ ] Export results (CSV, PDF)
- [ ] Multiple choice voting (select multiple options)
- [ ] Ranked choice voting
- [ ] Anonymous vs. verified voting modes
- [ ] Poll categories and search
- [ ] Rate limiting with Redis
- [ ] IP geolocation for better abuse detection
- [ ] Admin dashboard for moderation
- [ ] Email notifications for poll creators
- [ ] Custom poll themes and branding

## Contributing

This is an assignment project. For the actual implementation:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License

## Author

Deepyaman Mondal
- GitHub: [https://github.com/DevRony04]
- LinkedIn: [https://www.linkedin.com/in/deepyaman-mondal-8592a3265]

## Acknowledgments

- Next.js team for the amazing framework
- shadcn for the beautiful UI components
- Pusher for real-time infrastructure
- Vercel for hosting and database
