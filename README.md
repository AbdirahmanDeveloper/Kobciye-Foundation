# charity-platform

A scalable backend for a Charity Platform that enables users to register, donate to projects, view campaigns, and manage content securely. Built with Node.js, Express, MongoDB, and MVC architecture.

This project supports authentication, role-based access, project management, donations, and news publishing.

🚀 Features
👤 User & Authentication

User registration & login (JWT)

Secure password hashing

Role-based access (Admin / User)

Profile view & update

Admin user management

❤️ Charity Projects

Create & manage charity campaigns

Track funding goals & raised amounts

Public project listing

💸 Donations

Users can donate to projects

Donation history tracking

Project fund updates

📰 News & Updates

Publish charity-related news

Admin-controlled content

🛠 Developer Tools

MongoDB seeding with dev data

Environment variable configuration

MVC-based code structure

RESTful API architecture

🧱 Tech Stack

Node.js

Express.js

MongoDB + Mongoose

JWT Authentication

bcrypt (Password Hashing)

Postman (API Testing)

MVC Architecture

📁 Project Structure
charity-platform/
├── dev-data/ # JSON seed data
├── src/
│ ├── controllers/ # Business logic
│ ├── middleware/ # Auth & helpers
│ ├── models/ # MongoDB schemas
│ ├── routes/ # API routes
│ ├── config/ # DB & env config
│ └── app.js # Express setup
├── server.js # Entry point
├── .env # Environment variables
└── package.json

⚙️ Setup & Installation
1️⃣ Clone the Repo
git clone https://github.com/your-username/charity-platform.git
cd charity-platform

2️⃣ Install Dependencies
npm install

3️⃣ Create Environment File

Create .env in project root:

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d

4️⃣ Seed Sample Data (Optional)
node src/middleware/db-seeder.js import

To delete seeded data:

node src/middleware/db-seeder.js delete

5️⃣ Run the Server
npm run dev

Server runs at:

http://localhost:5000

🔐 API Authentication
Signup
POST /api/users/signup

Login
POST /api/users/login

Returns a JWT token.

Use token in protected requests:

Authorization: Bearer <TOKEN>

📌 Core API Routes
Users
Method Route Access
POST /api/users/signup Public
POST /api/users/login Public
GET /api/users/me User
PATCH /api/users/me User
GET /api/users Admin
DELETE /api/users/:id Admin
Projects
Method Route Access
GET /api/projects Public
POST /api/projects Admin
PATCH /api/projects/:id Admin
DELETE /api/projects/:id Admin
Donations
Method Route Access
POST /api/donations User
GET /api/donations Admin
GET /api/donations/me User
News
Method Route Access
GET /api/news Public
POST /api/news Admin
PATCH /api/news/:id Admin
DELETE /api/news/:id Admin
🧪 Testing with Postman

Import JWT automatically via environment variable

Use Bearer {{JWT}} in Authorization header

Test CRUD operations for all modules

🔐 Security Practices

Hashed passwords (bcrypt)

JWT authentication

Role-based authorization

.env excluded from GitHub

Input validation & safe updates

🤝 Collaboration Workflow

Feature branches (backend-dev)

Pull Requests to merge into main

Code review before merging

Clean commit messages

📌 Future Enhancements

Payment gateway integration (Stripe / PayPal)

Email notifications

Admin analytics dashboard

Frontend integration (Pug / React)

Deployment (Render / Railway / AWS)

👨‍💻 Authors

Backend: Haasan
Frontend: Project Collaborator
Project Type: Charity Platform

📜 License

MIT License — free to use and modify.
