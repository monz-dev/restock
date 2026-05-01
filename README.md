# MVP Sistema de Pedidos

Sistema de pedidos en tiempo real para comercios. Mobile-first, one-click ordering with realtime dashboard.

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key (public, browser-safe)
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (private, server-only)

### 3. Run database migrations

```bash
# Run the schema migration in Supabase SQL editor or via CLI
psql $DATABASE_URL -f supabase/migrations/001_create_clientes_productos_pedidos.sql
psql $DATABASE_URL -f supabase/seeds/001_seed_initial_data.sql
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
mvp-pedidos-alain/
├── app/
│   ├── (auth)/
│   │   └── login/           # Login page with UI + logic
│   ├── (dashboard)/
│   │   ├── dashboard/        # Provider dashboard (realtime pedidos)
│   │   ├── mis-pedidos/      # Client order history page
│   │   ├── admin/            # Admin panel for user-client assignments
│   │   └── suppliers/        # Suppliers management
│   ├── [slug]/page.tsx      # Client order page (/alain-carnes)
│   ├── api/pedido/route.ts  # POST endpoint for new orders
│   ├── layout.tsx           # Root layout with providers
│   ├── page.tsx             # Root redirect
│   └── globals.css          # Global styles + Manrope font
├── lib/
│   └── supabase/
│       ├── client.ts         # Supabase client + types
│       └── queries/          # Database query functions
├── components/
│   ├── NotificationToast.tsx  # Notification UI
│   ├── ProductCard.tsx        # Product display card
│   └── ThemeToggle.tsx        # Dark/Light mode toggle
├── public/
│   ├── manifest.json         # PWA manifest
│   ├── sw.js                 # Service worker
│   └── icons/                # PWA icons
├── supabase/
│   ├── migrations/           # Database migrations
│   ├── seeds/               # Seed data
│   └── storage/              # Bucket config for logos
├── types/                    # TypeScript type definitions
└── openspec/                 # SDD artifacts
```

## Features

### Core Functionality
- **Client Page**: Mobile-first one-click ordering with product grid
- **Dashboard**: Realtime pedidos list with Supabase subscriptions
- **Mis Pedidos**: Order history page for clients with card UI
- **Notifications**: Toast + sound + push notifications
- **PWA**: Installable, works offline

### Authentication & Authorization
- **Login System**: Full UI with email/password authentication
- **Roles & Permissions**: Admin, Provider, and Client roles with route protection
- **User-Client Assignment**: Link users to specific comercios (usuario_clientes table)

### Admin Features
- **Admin Panel**: Manage user-client assignments
- **Suppliers Management**: CRUD operations for suppliers
- **Bucket Storage**: Image/logos storage in Supabase

### UI/UX
- **Dark/Light Mode**: Theme toggle with system preference detection
- **Typography**: Manrope font family integration
- **Responsive Design**: Mobile-first with Tailwind CSS
- **Address Links**: Clickable addresses with map URLs

### Technical
- **Real-time**: Updates via Supabase Postgres Changes
- **TypeScript**: Full type safety across the project
- **Next.js 14**: App Router with server/client components

## Creating New Clients

To add a new client (comercio):

```sql
INSERT INTO clientes (nombre, slug, activo) VALUES 
('Mi Comercio', 'mi-comercio', true);
```

Share the URL: `https://yoursite.com/mi-comercio`

## Database Schema

Key tables:
- `clientes` - Comercios/clients
- `productos` - Available products per client
- `pedidos` - Order records
- `usuarios` - User accounts with roles
- `usuario_clientes` - User-to-client assignments
- `suppliers` - Supplier management

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Backend**: Supabase (PostgreSQL + Realtime + Auth + Storage)
- **Styling**: Tailwind CSS v3.4
- **Language**: TypeScript 5.3
- **Fonts**: Manrope (Google Fonts)

## Environment Variables

Required in `.env.local`:
```
# Client-side (public)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Server-side (private, NEVER expose to browser)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

⚠️ **Important**: The `SUPABASE_SERVICE_ROLE_KEY` bypasses Row Level Security (RLS) and should NEVER be exposed to the client. Use it only in server-side code (API routes, server actions).

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## License

MIT