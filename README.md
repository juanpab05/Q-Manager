# Q-Manager Application

Q-Manager is a user attention management system designed to coordinate and manage customer service queues across multiple access points. It prioritizes requests and optimizes workflow efficiently, aiming to transform the waiting experience.

## Deployed Version
The application is deployed and accessible at: [https://q-manager-eta.vercel.app/](https://q-manager-eta.vercel.app/)

## Features

-   User authentication (Email/Password, Phone OTP)
-   Email confirmation and Password recovery
-   Turn and queue management system
-   Real-time queue status visualization
-   Admin dashboard for system management:
    -   User data management
    -   Access point configuration
    -   Worker management
    -   System announcements
-   Service catalog management (Implicit from database tables)

## Tech Stack

-   **Frontend:**
    -   React
    -   Vite
    -   TypeScript
    -   Tailwind CSS
-   **Backend (Serverless):**
    -   Supabase (Authentication, Database, Realtime)

## Local Development

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

-   Node.js (v18.x or later recommended)
-   npm (v9.x or later) or yarn

### Installation

1.  **Clone the repository:**
    ```sh
    git clone <your-repository-url>
    cd <repository-folder-name> 
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```
    or if you prefer yarn:
    ```sh
    yarn install
    ```

### Environment Variables

You'll need to configure environment variables for the project to work correctly.

1.  Create a `.env` file in the root of your project.
2.  Add the necessary environment variables (contact the project maintainer for details).

### Running the Development Server

Once the dependencies are installed and environment variables are set up, you can start the development server:

```sh
npm run dev
```

This will start the application on `http://localhost:5173` (or another port if 5173 is in use).
