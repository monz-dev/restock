# MVP Sistema de Pedidos

Sistema de pedidos en tiempo real para comercios. Mobile-first, one-click ordering with realtime dashboard

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
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key

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
│   ├── [slug]/page.tsx      # Client order page (/alain-carnes)
│   ├── dashboard/page.tsx     # Provider dashboard
│   ├── api/pedido/route.ts # POST endpoint for new orders
│   ├── layout.tsx          # Root layout
│   ├── page.tsx           # Root redirect
│   └── globals.css        # Global styles
├── lib/supabase/
│   └── client.ts          # Supabase client + types
├── components/
│   └── NotificationToast.tsx  # Notification UI
├── public/
│   ├── manifest.json     # PWA manifest
│   ├── sw.js             # Service worker
│   └── icons/            # PWA icons
├── supabase/
│   ├── migrations/       # Database migrations
│   └── seeds/           # Seed data
└── openspec/            # SDD artifacts
```

## Features

- **Client Page**: Mobile-first one-click ordering
- **Dashboard**: Realtime pedidos list with Supabase
- **Notifications**: Toast + sound + push notifications
- **PWA**: Installable, works offline
- **Real-time**: Updates via Supabase Postgres Changes

## Creating New Clients

To add a new client (comercio):

```sql
INSERT INTO clientes (nombre, slug, activo) VALUES 
('Mi Comercio', 'mi-comercio', true);
```

Share the URL: `https://yoursite.com/mi-comercio`

## Tech Stack

- Next.js 14 (App Router)
- Supabase (PostgreSQL + Realtime)
- Tailwind CSS
- TypeScript.

## License

MIT