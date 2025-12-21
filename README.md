🏙️ Rapid City: Public Infrastructure Issue Reporting System

Rapid City is a high-performance digital platform designed to bridge the gap between citizens and municipal services. It empowers residents to report real-world infrastructure problems—like potholes, broken streetlights, or water leakages—while providing government staff and admins with a robust dashboard to manage, assign, and resolve these issues in real-time.

📌 Project Overview
The core objective of this system is to improve urban transparency and reduce response times for city maintenance. By centralizing reporting, the platform allows for efficient data collection and analysis of infrastructure health.

✨ Key Features
Role-Based Access Control: Secure, specialized dashboards for Admins, Staff, and Citizens.

Interactive Issue Reporting: Citizens can submit reports with titles, detailed descriptions, categories, and image uploads.

Real-Time Issue Tracking: A read-only Timeline/Stepper UI tracks every action from "Pending" to "Closed" for full audit transparency.

Priority Boosting (Stripe Integration): Citizens can pay a fee (100tk) to "Boost" an issue, moving it to the top of the queue for faster attention.

Smart Assignment System: Admins can view available staff and assign issues with a single click; assigned staff get instant dashboard notifications.

Comprehensive Data Visualization: Integration with Recharts to display total reports, pending vs. resolved issues, and payment analytics.

Advanced Server-Side Searching: Robust filtering on the "All Issues" page by category, status, priority, and location.

Premium Subscription Model: Users can upgrade to a "Premium" tier for 1000tk to report unlimited issues beyond the standard limit of 3.



🛠 Tech Stack & Tools
Backend & Security

Server: Node.js, Express.js

Database: MongoDB

Authentication: Firebase Auth (Email/Password & Google)

Security: Axios Interceptors for JWT token verification and Role-Based Middleware.



🗺️ How It Works
Report: Citizen submits an issue with a photo.

Assign: Admin reviews the "Pending" list and assigns it to a verified Staff member.

Resolve: Staff updates the status to "Working" then "Resolved" as they fix the problem.

Verify: The timeline is updated automatically,

