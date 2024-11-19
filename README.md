# Finance Dashboard

A modern financial management dashboard built with React, designed primarily for testing [Mocksi](https://mocksi.ai) - an AI-powered API mocking and testing platform.

## Overview

This application demonstrates common financial management features including:
- Invoice management with status workflows
- Transaction tracking and categorization
- Financial reporting and analytics
- Team management and role-based access control
- Company profile and user settings

## Tech Stack

- Frontend: React with Tailwind CSS
- Backend: Node.js/Express
- Database: PostgreSQL
- Authentication: JWT-based auth
- Deployment: Render.com

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- PostgreSQL database

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/finance-dashboard.git
   cd finance-dashboard
   ```

2. Install dependencies:
   ```bash
   # Install frontend dependencies
   cd client
   npm install

   # Install backend dependencies
   cd ../server
   npm install
   ```

3. Set up environment variables:
   ```bash
   # In server directory, create .env file
   DATABASE_URL=your_postgres_connection_string
   JWT_SECRET=your_jwt_secret
   NODE_ENV=development
   ```

4. Start the development servers:
   ```bash
   # Start backend (from server directory)
   npm run dev

   # Start frontend (from client directory)
   npm start
   ```

## Testing with Mocksi

This application is designed to work seamlessly with Mocksi for API testing. Key integration points include:

- RESTful API endpoints for financial operations
- JWT-based authentication flow
- Role-based access control
- Error handling and status codes
- Data validation and transformation

To use with Mocksi:
1. Import the API collection
2. Configure environment variables
3. Run automated tests through the Mocksi platform

## Available Scripts

### Frontend (in `client` directory)
- `npm start`: Run development server
- `npm test`: Run test suite
- `npm run build`: Build for production
- `npm run lint`: Run linter

### Backend (in `server` directory)
- `npm run dev`: Run development server with nodemon
- `npm start`: Run production server
- `npm test`: Run test suite

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Create React App](https://github.com/facebook/create-react-app)
- Styled with [Tailwind CSS](https://tailwindcss.com)
- Icons by [Lucide](https://lucide.dev)
