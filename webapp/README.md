# How it works:

**ISR Implementation:** The `getStaticProps` function fetches the latest version of each file from MongoDB and uses ISR with a 60-second revalidation period.

**File Assembly:** The component automatically finds `index.html` and `styles.css` files and injects the CSS directly into the HTML.

**Dynamic Updates:** Files are automatically updated every 60 seconds, or you can trigger manual updates via the `/api/revalidate` endpoint.

**Webhook Support:** The `/api/webhook` endpoint allows external systems to trigger page revalidation when files are updated.

**File Serving:** The `/api/files/[...path]` endpoint serves individual files directly from MongoDB.

## Usage:

Set your `MONGODB_URI` in `.env.local`
Run `npm run dev` to start development
The site will automatically update when files in MongoDB are modified
Use POST `/api/revalidate` to manually trigger updates
Use POST `/api/webhook` for automated updates from external systems
The application will render your HTML content with embedded CSS and JavaScript, creating a fully functional website that updates automatically based on your MongoDB file storage system.