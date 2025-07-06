# Lottery Checker App

A comprehensive lottery management system with real-time features, built with Expo and Supabase.

## Features

### Mobile App
- 📱 **Ticket Management**: Add, view, and manage lottery tickets
- 🏆 **Real-time Results**: Automatic result checking and notifications
- 📊 **Personal Analytics**: Track your wins, statistics, and history
- 🔔 **Smart Notifications**: Get notified about wins and new draws
- 📱 **SMS Integration**: Automatic ticket detection from SMS (mobile only)
- 🎯 **Match Analysis**: See how many digits matched for each ticket

### Admin Web Panel
- 🎲 **Winning Numbers Management**: Add and manage monthly winning numbers
- 👥 **User Management**: View all users and their statistics
- 📈 **Analytics Dashboard**: Comprehensive analytics and reporting
- 🔍 **Ticket Monitoring**: View all submitted tickets across users
- ⚙️ **System Settings**: Configure app behavior and features
- 📋 **Activity Logs**: Track all admin activities
- 🏆 **Leaderboards**: See top winners and statistics

### Real-time Features
- ⚡ **Live Updates**: All data syncs in real-time across devices
- 🔄 **Automatic Calculations**: Results calculated instantly when winning numbers are announced
- 📱 **Push Notifications**: Instant notifications for winners
- 🔄 **Cross-platform Sync**: Data syncs between mobile app and admin panel

## Technology Stack

- **Frontend**: React Native with Expo
- **Backend**: Supabase (PostgreSQL + Real-time)
- **Authentication**: Supabase Auth
- **Database**: PostgreSQL with Row Level Security
- **Real-time**: Supabase Real-time subscriptions
- **Admin Panel**: React with TypeScript

## Database Schema

### Core Tables
- `profiles` - User profiles and preferences
- `tickets` - Lottery tickets submitted by users
- `winning_numbers` - Monthly winning numbers
- `ticket_results` - Calculated results for each ticket
- `notifications` - System notifications
- `admin_logs` - Admin activity tracking
- `system_settings` - Application configuration

### Advanced Features
- **Automatic Result Calculation**: Triggers automatically calculate results when winning numbers are added
- **Real-time Notifications**: Users get notified instantly when they win
- **Analytics Views**: Pre-built views for statistics and reporting
- **Admin Activity Logging**: All admin actions are logged for audit trails

## Setup Instructions

### 1. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the migration files in order:
   ```sql
   -- Run these in your Supabase SQL editor
   -- 1. supabase/migrations/create_lottery_system.sql
   -- 2. supabase/migrations/create_functions_and_triggers.sql
   -- 3. supabase/migrations/create_views_and_analytics.sql
   -- 4. supabase/migrations/insert_initial_data.sql
   ```
3. Get your project URL and anon key from Settings > API

### 2. Environment Setup

1. Copy `.env.example` to `.env`
2. Fill in your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Application

```bash
# Start the mobile app
npm run dev

# For admin panel (in admin directory)
cd admin
npm install
npm run dev
```

## Usage

### Mobile App

1. **Sign Up/Login**: Create an account or login
2. **Add Tickets**: Manually enter your lottery ticket numbers
3. **Check Results**: View results automatically when winning numbers are announced
4. **Get Notifications**: Receive instant notifications for wins and new draws
5. **View Analytics**: Track your statistics and winning history

### Admin Panel

1. **Access**: Navigate to `/admin` route (web only)
2. **Login**: Use admin credentials (demo: admin/lottery2025)
3. **Add Winning Numbers**: Enter monthly winning numbers
4. **Monitor Users**: View all users and their tickets
5. **Analytics**: Access comprehensive reporting and statistics

## Real-time Features

The app uses Supabase real-time subscriptions for:

- **Live ticket updates** when users add new tickets
- **Instant result calculations** when winning numbers are announced
- **Real-time notifications** for winners
- **Live admin dashboard** updates
- **Cross-device synchronization**

## Security Features

- **Row Level Security (RLS)**: Users can only access their own data
- **Admin Role Management**: Role-based access control
- **Secure Authentication**: Supabase Auth with email/password
- **Activity Logging**: All admin actions are logged
- **Data Validation**: Server-side validation for all inputs

## Outstanding Features

1. **Intelligent Match Analysis**: Shows exactly which digits matched
2. **Predictive Analytics**: Historical analysis and trends
3. **Multi-platform Support**: Works on iOS, Android, and Web
4. **Scalable Architecture**: Built to handle thousands of users
5. **Real-time Collaboration**: Admin changes reflect instantly for users
6. **Comprehensive Audit Trail**: Every action is logged and traceable
7. **Smart Notifications**: Context-aware notifications with rich data
8. **Advanced Analytics**: Deep insights into user behavior and lottery patterns

## API Endpoints

The app includes API routes for:
- `/api/winning-numbers` - Manage winning numbers
- Real-time subscriptions for live updates
- Secure admin operations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.