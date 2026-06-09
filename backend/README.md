# Initialize Node.js project

npm init -y

<!-- Install Dependencies -->

# Core dependencies

npm install express cors dotenv

- express: Web framework for building REST APIs
- cors: Allows frontend (different port) to communicate with backend
- dotenv: Loads environment variables from .env file

# Database & ORM

npm install pg sequelize

- pg: PostgreSQL driver
- sequelize: ORM (Object-Relational Mapping) to interact with PostgreSQL easily

# Authentication

npm install bcryptjs jsonwebtoken

- bcryptjs: Hashes passwords securely
- jsonwebtoken: Creates and verifies JWT tokens for authentication

# Validation

npm install express-validator

- express-validator: Validates user input (email format, password strength)

# Logging

npm install winston

- winston: Professional logging system

# Development tools

npm install --save-dev nodemon

- nodemon: Auto-restarts server during development
