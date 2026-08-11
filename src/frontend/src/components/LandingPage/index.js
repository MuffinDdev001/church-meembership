import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header / Nav */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-indigo-600">Newlight Baptist Church</h1>
          </div>
          <nav className="flex items-center gap-4">
            <Link 
              to="/login" 
              className="text-gray-600 hover:text-indigo-600 font-medium transition-colors"
            >
              Login
            </Link>
            <Link 
              to="/dashboard" 
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors font-medium shadow-sm"
            >
              Go to Dashboard
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
            Welcome to Newlight Baptist Church
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
            Our official portal for managing church activities, connecting with our congregation, and streamlining our ministry operations.
          </p>
          <div className="flex justify-center gap-4">
            <Link 
              to="/signup" 
              className="bg-indigo-600 text-white px-8 py-3 rounded-md text-lg font-semibold hover:bg-indigo-700 transition-colors shadow-md"
            >
              Get Started
            </Link>
            <a 
              href="#contact" 
              className="bg-white text-indigo-600 border border-indigo-600 px-8 py-3 rounded-md text-lg font-semibold hover:bg-indigo-50 transition-colors"
            >
              Contact Us
            </a>
          </div>
        </section>

        {/* Business Information Section (Crucial for Twilio A2P 10DLC) */}
        <section id="contact" className="bg-white py-16 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-gray-900">About Our Organization</h3>
              <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
                Official contact information and business details for Newlight Baptist Church.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="p-6 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Office Address</h4>
                <p className="text-gray-600">123 Faith Avenue</p>
                <p className="text-gray-600">City, State 12345</p>
              </div>
              
              <div className="p-6 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Phone Number</h4>
                <p className="text-gray-600">(555) 123-4567</p>
                <p className="text-sm text-gray-500 mt-1">Available Mon-Fri, 9am - 5pm</p>
              </div>
              
              <div className="p-6 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Email Address</h4>
                <p className="text-gray-600">contact@newlightbaptist.local</p>
                <p className="text-sm text-gray-500 mt-1">We typically reply within 24 hours</p>
              </div>
            </div>
          </div>
        </section>

        {/* SMS/Privacy Policy Section (Mandatory for Twilio) */}
        <section className="bg-gray-50 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">SMS & Privacy Policy</h3>
            <div className="text-left bg-white p-8 rounded-lg shadow-sm text-gray-700 space-y-4">
              <p>
                <strong>SMS Communications:</strong> By providing your phone number, you agree to receive text messages from Newlight Baptist Church regarding service updates, event reminders, and important announcements. Message and data rates may apply. Reply STOP to opt-out at any time. Reply HELP for assistance.
              </p>
              <p>
                <strong>Privacy Commitment:</strong> We respect your privacy. We will not share or sell your personal information, including phone numbers and SMS opt-in consent, to third parties for marketing purposes.
              </p>
              <p>
                All data collected is strictly used for internal communication and providing you with the services offered through our platform.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; {new Date().getFullYear()} Newlight Baptist Church. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
