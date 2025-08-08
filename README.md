# RISE Transport Management System

Road Incidents Support and Emergency (RISE) Transport Management System - A comprehensive web application for managing transport operations across Ghana.

## 🚀 Features

- **Admin Dashboard** - Complete overview with analytics and reporting
- **Station Management** - Manage transport stations across regions
- **Vehicle & Driver Management** - Fleet and personnel tracking
- **Trip Booking System** - Real-time trip scheduling and passenger management
- **Accident Analysis** - Safety monitoring and incident reporting
- **Revenue Tracking** - Financial analytics and reporting
- **User Management** - Role-based access control
- **Ratings & Complaints** - Customer feedback system
- **Mobile Responsive** - Optimized for all devices

## 🛠️ Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS v4** for styling
- **Radix UI** components for accessibility
- **Recharts** for data visualization
- **Lucide React** for icons
- **React Hook Form** for form management

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn package manager

## 🏃‍♂️ Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The application will open at `http://localhost:3000`

### 3. Build for Production

```bash
npm run build
```

### 4. Preview Production Build

```bash
npm run preview
```

## 🎯 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint for code quality

## 👥 User Roles

### Administrator
- Full system access
- User management
- All reporting capabilities
- Accident analysis
- Revenue tracking

### Station Worker
- Station-specific access
- Trip booking and management
- Vehicle and driver management for assigned station
- Basic reporting

## 🔐 Default Login Credentials

**Administrator:**
- Email: `admin@rise.com`
- Password: `admin123`

**Station Worker:**
- Email: `worker@rise.com`
- Password: `worker123`

## 📱 Mobile Support

The application is fully responsive and optimized for:
- Desktop computers
- Tablets
- Mobile phones
- Touch interfaces

## 🎨 Design System

- Base font size: 14px (15px on mobile)
- Color scheme: Professional transport industry colors
- Dark mode support
- Consistent spacing and typography
- Accessible color contrasts

## 🔧 Development

### Project Structure

```
├── components/           # React components
│   ├── ui/              # Reusable UI components
│   ├── constants/       # Mock data and constants
│   ├── hooks/          # Custom React hooks
│   └── utils/          # Utility functions
├── styles/             # Global CSS and Tailwind config
└── App.tsx            # Main application component
```

### Adding New Components

1. Create component in appropriate folder
2. Export from component file
3. Import and use in parent components
4. Follow TypeScript best practices

### Styling Guidelines

- Use Tailwind utility classes
- Follow mobile-first responsive design
- Maintain consistent spacing using design tokens
- Test on multiple screen sizes

## 🚀 Deployment

### Build Optimization

The production build includes:
- Code splitting for optimal loading
- Asset optimization
- TypeScript compilation
- Tree shaking for smaller bundles

### Environment Setup

Create `.env` file for environment variables:

```env
VITE_APP_NAME=RISE Transport System
VITE_API_URL=your-api-url
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Email: support@rise.com
- Documentation: [Internal Wiki]
- Issue Tracker: [GitHub Issues]

---

Built with ❤️ for Ghana's transport industry