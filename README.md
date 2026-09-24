# Tenuta Monteromola

A lightweight sales, inventory and performance management application built for **Tenuta Monteromola**, a small Italian producer of wine and honey.

The application provides a simple mobile-first interface for managing daily sales, stock, prices and business performance.

![Tenuta Monteromola App](public/github-preview.png)


## Features

- Sales registration
- Historical sales tracking
- Custom sale dates
- Paid and pending payment management
- Gift orders
- Percentage discounts
- Automatic inventory updates
- Editable product prices
- Wine, honey and packaging management
- Monthly revenue monitoring
- Sales performance analytics
- Product ranking
- Mobile-first interface
- PWA support

## Products

The application currently manages:

**Wine**
- Onelia
- Giulio
- Gea

**Honey**
- Acacia — 250g / 500g
- Millefiori — 250g / 500g
- Melata — 250g / 500g

**Packaging**
- 3 wine box formats
- 2 honey box formats

Products, prices and inventory levels are managed directly from the application.

## Sales Management

Each sale can include multiple products and packaging options.

The system supports:

- Customer information
- Custom sale date
- Payment method
- Paid / pending payment status
- Percentage discounts
- Gift orders
- Notes

Pending orders immediately reduce inventory but are excluded from revenue until payment is confirmed.

## Inventory

Inventory quantities are automatically updated whenever a sale is registered.

When a sale is deleted, the corresponding quantities are restored to inventory.

This keeps stock levels synchronized with the sales history.

## Analytics

The application provides a simple overview of business performance, including:

- Monthly revenue
- Number of sales
- Average order value
- Month-over-month comparison
- Best-selling products
- Sales trends

## Tech Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase
- PostgreSQL
- Vercel
- Lucide Icons

## Architecture

```text
Next.js / React
      │
      ├── Sales
      ├── Orders
      ├── Inventory
      ├── Prices
      └── Analytics
              │
              ▼
           Supabase
              │
              ▼
          PostgreSQL