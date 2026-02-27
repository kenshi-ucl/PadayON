# PadayON - Shopify for Filipino Micro-Businesses

> The all-in-one platform for businesses in the Philippines.

## 🌟 Features

### For Sari-Sari Stores
- **Fast POS System** - Tap-to-add, barcode scanning, offline support
- **Utang Tracking** - Credit management with customer limits
- **FREE SMS Reminders** - Automated payment reminders via Semaphore
- **Tingi Pricing** - Support for retail/single piece pricing
- **E-Loading** - Additional income from load sales
- **Inventory Alerts** - Low stock notifications

### For Laundry Shops
- **Order Workflow** - Track from drop-off to delivery
- **Weight-based Pricing** - Flexible pricing per kg or per piece
- **Express Service** - Rush/express multipliers
- **SMS Notifications** - Auto-notify when laundry is ready
- **Pickup/Delivery Scheduling** - Route optimization
- **Garment Checklist** - Document condition on receipt

### For Food Catering
- **Event Calendar** - Visual booking with conflict detection
- **Menu Management** - Dishes with cost tracking
- **Package Builder** - Tiered per-head pricing
- **Kitchen Production** - BEO and production sheets
- **Equipment Rentals** - Track chafing dishes, tables, etc.

### Payment Integration
- **GCash** - 2.5% fee via PayMongo
- **Maya** - 2.5% fee via PayMongo
- **Credit/Debit Cards** - 3.5% + ₱15
- **Cash on Delivery** - Via LBC Express
- **OTC Payments** - Via DragonPay (7-Eleven, Bayad Centers)

## 🚀 Quick Start

### Prerequisites
- PHP 8.2+
- Composer
- Node.js 18+
- MySQL 8.0 or PostgreSQL 14+
- Redis (for queues/cache)

### Installation

```bash
# Clone the repository
git clone https://github.com/cantiumcode/PadayON.git
cd PadayON

# Install PHP dependencies
composer install

# Install Node dependencies
npm install

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Run migrations
php artisan migrate

# Seed demo data (optional)
php artisan db:seed

# Build assets
npm run build

# Start the development server
php artisan serve
```

### Configuration

1. **Database**: Update `.env` with your database credentials
2. **PayMongo**: Add your API keys for payment processing
3. **SMS (Semaphore)**: Add API key for SMS notifications
4. **Redis**: Configure for queues and caching

```env
# PayMongo
PAYMONGO_SECRET_KEY=sk_test_xxxxx
PAYMONGO_PUBLIC_KEY=pk_test_xxxxx

# SMS
SEMAPHORE_API_KEY=your_api_key
SEMAPHORE_SENDER_NAME=PadayON

# Redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
```

## 📦 Tech Stack

- **Backend**: Laravel 11
- **Frontend**: React 18 + TypeScript + Inertia.js
- **Styling**: Tailwind CSS + SCSS
- **Database**: MySQL/PostgreSQL
- **Cache/Queue**: Redis
- **Real-time**: Pusher/Laravel Reverb
- **Multi-tenancy**: stancl/tenancy

## 🏗️ Architecture

### Multi-Tenant Single Database
PadayON uses a single-database multi-tenancy approach with `tenant_id` columns for optimal performance with many small businesses.

```
Central Domain: PadayON.ph
├── /login, /register (auth)
├── /pricing, /features (marketing)
└── /admin/* (platform admin)

Tenant Domains: {slug}.PadayON.ph
├── / (dashboard)
├── /pos (point of sale)
├── /laundry/* (laundry management)
├── /catering/* (catering management)
├── /customers/* (CRM)
└── /settings/* (configuration)
```

## 🔧 Development

```bash
# Start development server
npm run dev

# Run tests
php artisan test

# Code style
./vendor/bin/pint

# Generate IDE helpers
php artisan ide-helper:generate
```

## 🚢 Deployment

### Docker Deployment

```bash
# Build and run
docker-compose up -d

# Run migrations
docker-compose exec app php artisan migrate
```

### Manual Deployment

1. Clone to server
2. Run `composer install --optimize-autoloader --no-dev`
3. Run `npm ci && npm run build`
4. Configure `.env` for production
5. Run `php artisan config:cache && php artisan route:cache`
6. Set up queue worker (Supervisor recommended)
7. Configure Nginx/Apache with SSL

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name PadayON.ph *.PadayON.ph;
    root /var/www/PadayON/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

## 📊 Database Schema

Key tables:
- `tenants` - Business accounts
- `users` - Staff accounts
- `customers` - Customer records with credit tracking
- `products` - Inventory items
- `orders` / `order_items` - Sales transactions
- `payments` - Payment records
- `laundry_orders` - Laundry job tracking
- `catering_events` - Event bookings
- `sms_messages` - SMS history

## 💳 Payment Processing

### PayMongo Integration
```php
// Create checkout session
$paymongo = app(PayMongoService::class);
$session = $paymongo->createCheckoutSession($order);

// Redirect to checkout
return redirect($session['attributes']['checkout_url']);
```

### Webhook Handling
Configure webhook endpoint at PayMongo dashboard:
`https://PadayON.ph/webhooks/paymongo`

## 📱 SMS Service

```php
// Send credit reminder
$smsService = app(SmsService::class);
$smsService->sendCreditReminder($customer);

// Send order confirmation
$smsService->sendOrderConfirmation($order);
```

## 🔐 Security

- CSRF protection on all forms
- SQL injection prevention via Eloquent
- XSS protection via Blade/React
- Rate limiting on authentication
- Secure password hashing (bcrypt)
- HTTPS enforced in production

## 📄 License

Proprietary - CantiumCode

## 🤝 Support

- Email: support@PadayON.ph
- Documentation: docs.PadayON.ph
- Facebook: fb.com/PadayONph

---

Built with 💙 by **CantiumCode** in the Philippines 🇵🇭
