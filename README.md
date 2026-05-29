# setup-server

> Production-ready, highly professional Express.js backend scaffolder CLI. Create robust, enterprise-grade server layouts in seconds.

---

## ⚡ Quick Start

You can run the interactive scaffolder immediately without local installation using `npx`:

```bash
npx setup-server
```

Or target a specific folder directory directly:

```bash
npx setup-server server
```

---

## ✨ Features

`setup-server` prepares complete, modular backend systems equipped with best practices and professional terminal graphics.

- 🛠️ **Languages**: Fully configured **TypeScript (tsconfig, build paths)** or **modern ES Modules JavaScript**.
- 🗄️ **Databases**: Native **MongoDB (Mongoose)** or **SQL (PostgreSQL, MySQL, SQLite)** using Sequelize.
- ⚙️ **Security & Utilities**: Auto-configures CORS, Helmet, Morgan logger, Express Rate Limiter, Cookie Parser, and Dotenv.
- 📁 **Media Storage**: Service integrations for **Local uploads (Multer)**, **AWS S3**, **Cloudinary**, **Firebase**, **Uploadcare**, and **Mux Video**.
- 📧 **Emails**: Production scripts for **SMTP Nodemailer**, **SendGrid**, **Mailgun**, **Brevo (Sendinblue)**, and **Mailcheap**.
- 🤖 **Automation**: High-fidelity, emoji-free console layouts and built-in Express/Zod **CRUD API compiler**.

---

## 🚀 Interactive Prompt Configurations

When executing `npx setup-server`, the CLI guides you through:
1. **Target Folder**: Current directory or a clean, auto-created folder directory.
2. **Language**: Choose between TypeScript (`ts`) or JavaScript (`js`).
3. **Database Engine**: MongoDB, PostgreSQL, MySQL, SQLite, or None.
4. **Middlewares & Security**: Interactive checkboxes for recommended tools.
5. **Storage Provider**: AWS S3, Cloudinary, Multer, or Mux.
6. **Email Services**: Nodemailer SMTP, SendGrid, Mailgun, Brevo, etc.
7. **Server Port**: Configure custom ports (defaults to `8080`).

---

## 🤖 Automatic CRUD Generation

Easily generate ready-to-use CRUD layers (Routes, Controller, Zod Validators) directly from your Mongoose schemas!

### 1. Define your Model
Create a model in `src/models/` (e.g. `src/models/Product.ts`):

```typescript
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    title: { type: String, required: true },
    price: { type: Number, required: true },
    active: { type: Boolean, default: true }
}, { timestamps: true });

export const Product = mongoose.model('Product', productSchema);
```

### 2. Run the CRUD Command
In your project directory, execute the compiler:

```bash
npx setup-server --crud Product
```

### 3. Generated Modules

The compiler analyzes your model schema and writes the following modular layers:

- **Controller** (`src/controllers/Product.controller.ts`): Implements `createProduct`, `getAllProducts` (with built-in pagination), `getProductById`, `updateProduct`, and `deleteProduct`.
- **Routes** (`src/routes/Product.routes.ts`): Sets up standard REST API endpoints mapping to controller operations.
- **Validators** (`src/validators/Product.validator.ts`): Generates Zod validation schemas (`createProductSchema`, `updateProductSchema`) for request body validation.

---

## 📂 Scaffold Directory Structure

The scaffolded project organizes code separation beautifully:

```text
├── src/
│   ├── config/          # Database & configuration settings
│   ├── controllers/     # Controller logic handlers
│   ├── routes/          # Express route configurations
│   ├── middlewares/     # Error handler, logger, and security filters
│   ├── models/          # Mongoose or Sequelize models
│   ├── services/        # Storage uploads (S3, Multer) and email dispatches
│   ├── utils/           # Shared helper functions
│   ├── templates/       # HTML email layouts
│   ├── jobs/            # Smart cron-guardian schedule handlers
│   └── index.ts         # Main Express application entrypoint
├── .env                 # Environment variables
├── .env.example         # Reference environment variables
├── .gitignore           # Git ignore profiles
├── package.json         # Scaffolding packages and dependencies
└── tsconfig.json        # TypeScript compile profiles (if TS selected)
```

---

## 📄 License

This project is licensed under the MIT License.
