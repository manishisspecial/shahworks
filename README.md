# PeoplePulse HR - Modern HR Management System

A comprehensive HR management solution built with Next.js, TypeScript, and Supabase. Features include employee management, attendance tracking, leave management, payroll, and more.

## 🚀 Features

- **Employee Management**: Complete employee profiles with role-based access
- **Attendance Tracking**: Check-in/check-out with automatic hour calculation
- **Leave Management**: Request and approve leave with balance tracking
- **Payroll System**: Generate and download salary slips
- **Company Management**: Multi-tenant architecture with company isolation
- **Role-Based Access**: Employee, HR, and Admin roles with appropriate permissions
- **Mobile-First Design**: Responsive UI that works on all devices

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Email**: SendGrid
- **PDF Generation**: jsPDF, html2canvas

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- SendGrid account (optional, for email functionality)

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd hr-solutions-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Run the database schema in the SQL editor:
   ```sql
   -- Copy and paste the contents of database-schema.sql
   ```

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# SendGrid Configuration (optional)
SENDGRID_API_KEY=your_sendgrid_api_key
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🗄️ Database Schema

The application uses the following main tables:

- **companies**: Company information
- **user_profiles**: Employee profiles (extends Supabase auth)
- **attendance**: Daily attendance records
- **leave_requests**: Leave applications
- **leave_balance**: Leave balance tracking
- **salary_slips**: Payroll records
- **announcements**: Company announcements

## 🔐 Authentication & Authorization

- **Row Level Security (RLS)**: All tables have RLS enabled
- **Role-Based Access**: 
  - Employees can view/edit their own data
  - HR/Admin can view/manage all data within their company
- **Company Isolation**: Users can only access data from their own company

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🐛 Troubleshooting

### Common Issues

1. **Supabase Connection Error**
   - Verify your environment variables are correct
   - Check if your Supabase project is active
   - Ensure the database schema has been applied

2. **Authentication Issues**
   - Clear browser cache and cookies
   - Check if email verification is required
   - Verify user exists in Supabase auth

3. **Database Permission Errors**
   - Ensure RLS policies are properly configured
   - Check if user has the correct role assigned
   - Verify company_id is set for the user

4. **Build Errors**
   - Clear `.next` folder: `rm -rf .next`
   - Reinstall dependencies: `rm -rf node_modules && npm install`
   - Check TypeScript errors: `npm run lint`

### Development Tips

- Use Supabase dashboard to inspect data and debug issues
- Check browser console for client-side errors
- Monitor network requests in browser dev tools
- Use Supabase logs for server-side debugging

## 📱 Usage Guide

### For Administrators

1. **Register a new company**:
   - Go to `/register` and provide company details
   - Complete onboarding process
   - Set up initial company configuration

2. **Manage employees**:
   - Add new employees through `/employees/add`
   - Assign roles and departments
   - Monitor attendance and leave requests

3. **Generate reports**:
   - View attendance summaries
   - Process leave requests
   - Generate salary slips

### For Employees

1. **Complete profile setup**:
   - Login and complete onboarding
   - Update personal information
   - Set up contact details

2. **Daily operations**:
   - Check in/out attendance
   - Apply for leave
   - View salary slips
   - Read company announcements

## 🔒 Security Features

- **Row Level Security**: Database-level access control
- **JWT Authentication**: Secure token-based auth
- **Input Validation**: Client and server-side validation
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Content Security Policy headers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section above
- Review Supabase documentation for backend issues

## 🔄 Updates

Stay updated with the latest features and security patches by:
- Following the repository
- Checking release notes
- Running `npm update` regularly
