# CivicLens

> See what's built behind the scenes.

CivicLens uncovers the infrastructure decisions that shape communities — from public contracts and permits to zoning changes and government spending. Built for citizens, journalists, and researchers who want transparency without the bureaucratic runaround.

---

## Features

- 🏗️ Track public contracts, permits, and zoning decisions
- 💰 Visualize government spending and budgets
- 🔍 Search and filter civic data by location, category, or date
- 📊 Surface meaningful insights from raw public records
- 🔔 Get alerts on new activity in your area

---

## Tech Stack

- **Runtime:** Node.js
- **Frontend:** HTML/CSS/JS (or your framework of choice)
- **Backend:** Node.js / Express
- **Database:** (add yours here)
- **Data Sources:** Public government records & open data APIs

---

## Getting Started

### Prerequisites

- Node.js v18+
- npm or yarn

### Installation

```bash
git clone https://github.com/yourusername/civiclens.git
cd civiclens
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
DATABASE_URL=your_database_url
API_KEY=your_api_key
```

### Running Locally

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

### Building for Production

```bash
npm run build
npm start
```

---

## Project Structure

```
civiclens/
├── src/
│   ├── routes/        # Express routes
│   ├── controllers/   # Request handlers
│   ├── models/        # Data models
│   ├── services/      # Business logic
│   └── public/        # Static assets
├── .env.example
├── package.json
└── README.md
```

---

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## License

[MIT](LICENSE)

---

*CivicLens — formerly Ghost Infrastructure*
