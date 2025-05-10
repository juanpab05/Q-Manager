# Q-Manager Application

Q-Manager is a user attention management system designed to coordinate and manage customer service queues across multiple access points. It prioritizes requests and optimizes workflow efficiently, aiming to transform the waiting experience.

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
    -   Tailwind CSS (inferred)
-   **Backend (Serverless):**
    -   Supabase (Authentication, Database, Realtime)

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

-   Node.js (v18.x or later recommended)
-   npm (v9.x or later) or yarn

### Installation

1.  **Clone the repository (if you haven't already):**
    ```sh
    git clone <your-repository-url>
    cd <repository-folder-name> 
    ```
    *(Replace `<your-repository-url>` and `<repository-folder-name>` with your actual repository details)*

2.  **Navigate to the project directory:**
    If your React application is in a subdirectory (e.g., `frontend`), navigate into it. Based on your project structure, it seems the current directory (`Personal`) is the root of your React application. If not, adjust the `cd` command accordingly.
    *(Assuming the current directory is the project root for the React app)*

3.  **Install dependencies:**
    ```sh
    npm install
    ```
    (or `yarn install` if you prefer yarn)

### Environment Variables

The project uses Supabase for its backend services. You'll need to configure Supabase credentials in an environment file.

1.  Create a `.env` file in the root of your project (e.g., alongside `package.json` and `vite.config.ts`).
2.  Add the following environment variables to your `.env` file:

    ```env
    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

    Replace `your_supabase_project_url` and `your_supabase_anon_key` with your actual Supabase project URL and Anon (public) key. You can find these in your Supabase project dashboard under "Project Settings" > "API".

### Running the Development Server

Once the dependencies are installed and environment variables are set up, you can start the development server:

```sh
npm run dev
```

This will typically start the application on `http://localhost:5173` (or another port if 5173 is in use).

## Supabase Configuration (Backend Details)

This section is for reference if you need to set up a new Supabase project from scratch or understand the backend schema.

1.  **Create a Supabase Account & Project:**
    -   Visit [supabase.com](https://supabase.com) and create an account.
    -   Create a new project within your Supabase dashboard.

2.  **Authentication Setup:**
    -   In your Supabase project dashboard, navigate to "Authentication" > "Configuration" > "Providers".
    -   Enable the "Email" provider. You can also enable "Phone" if you are using OTP login.
    -   Under "Authentication" > "Configuration" > "Site URL", ensure your development URL (e.g., `http://localhost:5173`) is listed. For production, add your production URL.
    -   Configure other settings like "Redirect URLs" if necessary for OAuth providers or specific email link behaviors.

3.  **Database Schema:**
    The application relies on several tables in your Supabase database. Ensure these tables and their respective columns/policies are set up correctly. Key tables include:
    -   `users`: Stores user profile information (extends Supabase `auth.users`).
    -   `actors`: Manages user roles and priority status (linked to `users`).
    -   `workers`: Specific profiles for worker-type users (linked to `users`).
    -   `tickets`: Manages queue turns/tickets.
    -   `announcements`: Stores system-wide announcements.
    -   `access_points`: Defines service/attention points.
    -   `services`: Lists available services (this might be managed differently, e.g., as a simple list or a table depending on your setup).
    
    *Note: You may need to set up Row Level Security (RLS) policies on these tables to ensure proper data access control.*

4.  **Obtain Credentials:**
    -   Navigate to "Project Settings" > "API" in your Supabase dashboard.
    -   Copy the "Project URL" and the "anon" "public" key.
    -   Use these in your `.env` file as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

---
This README will be updated as more features are added or configurations change.
