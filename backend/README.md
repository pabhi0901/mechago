# Backend Overview

## Project Structure

The backend is organized as follows:

```
backend/
├── package.json
├── server.js
├── src/
│   ├── app.js
│   ├── controllers/
│   │   ├── admin.controller.js
│   │   ├── auth.controller.js
│   │   ├── customer.controller.js
│   │   ├── mechanic.controller.js
│   ├── db/
│   │   └── db.js
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── auth.validator.js
│   │   ├── customer.validator.js
│   │   ├── mechanic.validator.js
│   ├── models/
│   │   ├── customerProblem.model.js
│   │   ├── location.model.js
│   │   ├── user.model.js
│   ├── routes/
│   │   ├── admin.route.js
│   │   ├── auth.route.js
│   │   ├── customer.route.js
│   │   ├── mechanic.route.js
│   ├── services/
│   │   ├── email.service.js
│   │   ├── imagekit.service.js
```

## Dependencies

The project uses the following dependencies:

- `express`: Web framework for Node.js
- `cookie-parser`: Middleware to parse cookies
- `dotenv`: Loads environment variables from `.env` file
- `mongoose`: MongoDB object modeling tool
- `jsonwebtoken`: For handling JSON Web Tokens
- `bcryptjs`: For hashing passwords
- `multer`: Middleware for handling file uploads
- `imagekit`: For image storage and management
- `nodemailer`: For sending emails
- `axios`: For making HTTP requests
- `express-validator`: For validating request data
- `nanoid`: For generating unique IDs

## Application Flow

### Entry Point

The application starts with `server.js`, which initializes the Express app and sets up the server.

### Middleware

Global middlewares are defined in `src/app.js`:

- `express.json()`: Parses incoming JSON requests.
- `cookieParser()`: Parses cookies.

### Routes

The following routes are defined in `src/app.js`:

- `/api/auth`: Handled by `auth.route.js`
- `/api/admin`: Handled by `admin.route.js`
- `/api/mechanic`: Handled by `mechanic.route.js`
- `/api/customer`: Handled by `customer.route.js`

### Controllers

#### Customer Controller

The `customer.controller.js` file contains logic for customer-related operations. For example:

- **Find Nearby Mechanics**: 
  - Uses `location.model.js` to query nearby mechanics based on user-provided longitude, latitude, and radius.
  - Calculates distances using the Haversine formula.
  - Fetches driving routes using the OSRM API.

### Models

- `user.model.js`: Defines the schema for user data.
- `location.model.js`: Stores location data with geospatial indexing.
- `customerProblem.model.js`: Tracks customer-reported issues.

### Services

- `email.service.js`: Handles email-related functionality.
- `imagekit.service.js`: Manages image uploads and storage.

## Development

### Scripts

- `npm start`: Starts the application.
- `npm run dev`: Starts the application in development mode with `nodemon`.

### Environment Variables

The application uses `dotenv` to manage environment variables. Ensure a `.env` file is present with the required configurations.

## Future Enhancements

- Add more detailed logging.
- Implement unit and integration tests.
- Optimize database queries for performance.

---

This document provides an overview of the backend flow to help developers understand the structure and functionality of the application.