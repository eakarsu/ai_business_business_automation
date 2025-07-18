import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-8">
              AI Procurement Management
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
              Streamline your procurement process with AI-powered vendor management, 
              automated bid analysis, and intelligent compliance tracking.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                Get Started
              </Link>
              <Link
                href="/register"
                className="border border-indigo-600 text-indigo-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-indigo-50 transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Key Features</h2>
            <p className="text-xl text-gray-600">Everything you need to manage procurement efficiently</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl text-blue-600">🏢</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Vendor Management</h3>
              <p className="text-gray-600">
                Centralized vendor database with performance tracking, 
                qualification management, and automated onboarding workflows.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl text-green-600">📊</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Bid Management</h3>
              <p className="text-gray-600">
                Automated bid collection, AI-powered analysis, and 
                intelligent comparison tools for better decision making.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl text-purple-600">✅</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Compliance Tracking</h3>
              <p className="text-gray-600">
                Real-time compliance monitoring, automated alerts, 
                and comprehensive audit trails for regulatory requirements.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-indigo-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-white mb-2">500+</div>
              <div className="text-indigo-200">Vendors Managed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">$2M+</div>
              <div className="text-indigo-200">Cost Savings</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">99%</div>
              <div className="text-indigo-200">Compliance Rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">24/7</div>
              <div className="text-indigo-200">AI Monitoring</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to transform your procurement?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join leading organizations using AI to optimize their procurement processes
          </p>
          <Link
            href="/register"
            className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Start Free Trial
          </Link>
        </div>
      </div>
    </div>
  );
}
