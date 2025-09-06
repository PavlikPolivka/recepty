'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ChefHat, Crown, CheckCircle, Shield, Search } from 'lucide-react';
import AuthButton from '@/components/AuthButton';
import { createClient } from '@/lib/supabase/client';

export default function AdminPage() {
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [addSubLoading, setAddSubLoading] = useState(false);
  const [targetUserId, setTargetUserId] = useState('');
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminLoading, setAdminLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<{
    id: string;
    email: string;
    is_admin: boolean;
    created_at: string;
    subscription?: {
      plan: string;
      status: string;
      current_period_end: string | null;
    };
    recent_usage?: Array<{
      recipes_parsed: number;
      customizations_used: number;
      date: string;
    }>;
  } | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  const switchLanguage = (newLocale: string) => {
    router.push(`/${newLocale}/admin`);
  };

  // Check admin status when user changes
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setAdminLoading(false);
        return;
      }

      try {
        // Get the current session token
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.access_token) {
          setIsAdmin(false);
          setAdminLoading(false);
          return;
        }

        // Call the API to check admin status
        const response = await fetch('/api/admin/check-status', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Admin status check result:', data);
          setIsAdmin(data.isAdmin);
        } else {
          console.error('Failed to check admin status:', response.status);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setAdminLoading(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  const searchUser = async () => {
    if (!searchEmail.trim()) {
      setMessage('❌ Please enter an email address');
      return;
    }

    setSearchLoading(true);
    setMessage('');

    try {
      // Get the current session token
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setMessage('❌ Please sign in to search users');
        setSearchLoading(false);
        return;
      }

      // Call the API to search for user
      const response = await fetch('/api/admin/search-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: searchEmail.trim()
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.user);
        setTargetUserId(data.user?.id || '');
        setMessage(data.user ? `✅ User found: ${data.user.email}` : '❌ User not found');
      } else {
        const errorData = await response.json();
        setMessage(`❌ Error: ${errorData.error}`);
        setSearchResults(null);
      }
    } catch (error) {
      console.error('Error searching user:', error);
      setMessage(`❌ Error: ${error}`);
      setSearchResults(null);
    } finally {
      setSearchLoading(false);
    }
  };

  const grantLifetimeAccess = async () => {
    if (!targetUserId) {
      setMessage('❌ Please enter a user ID');
      return;
    }
    
    setLoading(true);
    setMessage('');

    try {
      // Get the current session token
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setMessage('❌ Please sign in to use admin functions');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/admin/grant-lifetime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId: targetUserId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✅ Lifetime access granted to user ${targetUserId}!`);
        setTargetUserId('');
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const addSubscription = async () => {
    if (!targetUserId) {
      setMessage('❌ Please enter a user ID');
      return;
    }
    
    setAddSubLoading(true);
    setMessage('');

    try {
      // Get the current session token
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setMessage('❌ Please sign in to use admin functions');
        setAddSubLoading(false);
        return;
      }

      const response = await fetch('/api/admin/add-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId: targetUserId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✅ Premium subscription added to user ${targetUserId}!`);
        setTargetUserId('');
      } else {
        setMessage(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error}`);
    } finally {
      setAddSubLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-2">
                <ChefHat className="h-8 w-8 text-orange-600" />
                <h1 className="text-xl font-bold text-gray-900">
                  Recipe Simplifier Admin
                </h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <div key={locale} className="flex items-center space-x-2">
                  <button
                    onClick={() => switchLanguage('en')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      locale === 'en'
                        ? 'bg-orange-100 text-orange-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => switchLanguage('cs')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      locale === 'cs'
                        ? 'bg-orange-100 text-orange-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    CS
                  </button>
                </div>
                <AuthButton />
              </div>
            </div>
          </div>
        </header>

        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in to access admin panel</h1>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while checking admin status
  if (adminLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-16 w-16 text-orange-500 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Checking admin access...</p>
        </div>
      </div>
    );
  }

  // Check if user is admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-2">
                <ChefHat className="h-8 w-8 text-orange-600" />
                <h1 className="text-xl font-bold text-gray-900">
                  Recipe Simplifier Admin
                </h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <div key={locale} className="flex items-center space-x-2">
                  <button
                    onClick={() => switchLanguage('en')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      locale === 'en'
                        ? 'bg-orange-100 text-orange-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => switchLanguage('cs')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      locale === 'cs'
                        ? 'bg-orange-100 text-orange-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    CS
                  </button>
                </div>
                <AuthButton />
              </div>
            </div>
          </div>
        </header>

        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <div className="text-center">
            <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-6">You don&apos;t have permission to access the admin panel.</p>
            <button
              onClick={() => router.push(`/${locale}/home`)}
              className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <ChefHat className="h-8 w-8 text-orange-600" />
              <h1 className="text-xl font-bold text-gray-900">
                Recipe Simplifier Admin
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div key={locale} className="flex items-center space-x-2">
                <button
                  onClick={() => switchLanguage('en')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    locale === 'en'
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => switchLanguage('cs')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    locale === 'cs'
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  CS
                </button>
              </div>
              <AuthButton />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center space-x-2 mb-6">
            <Shield className="h-8 w-8 text-orange-600" />
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          </div>

          <div className="space-y-6">
            {/* User Search */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Search className="h-5 w-5 mr-2 text-blue-600" />
                Search User by Email
              </h2>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <input
                    type="email"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    placeholder="Enter user email address"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    onKeyPress={(e) => e.key === 'Enter' && searchUser()}
                  />
                  <button
                    onClick={searchUser}
                    disabled={searchLoading || !searchEmail.trim()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {searchLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Search
                      </>
                    )}
                  </button>
                </div>
                
                {searchResults && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-3">User Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-blue-800">Email:</span>
                        <span className="ml-2 text-blue-700">{searchResults.email}</span>
                      </div>
                      <div>
                        <span className="font-medium text-blue-800">User ID:</span>
                        <span className="ml-2 text-blue-700 font-mono text-xs">{searchResults.id}</span>
                      </div>
                      <div>
                        <span className="font-medium text-blue-800">Admin:</span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                          searchResults.is_admin 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {searchResults.is_admin ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-blue-800">Plan:</span>
                        <span className="ml-2 text-blue-700">{searchResults.subscription?.plan || 'free'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-blue-800">Status:</span>
                        <span className="ml-2 text-blue-700">{searchResults.subscription?.status || 'inactive'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-blue-800">Created:</span>
                        <span className="ml-2 text-blue-700">{new Date(searchResults.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Crown className="h-5 w-5 mr-2 text-orange-600" />
                Grant Lifetime Access
              </h2>
              <p className="text-gray-700 mb-4">
                Grant lifetime access to a specific user. User ID will be auto-filled if you searched for a user above.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    Target User ID
                  </label>
                  <input
                    type="text"
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    placeholder="Enter user ID (UUID) or search for user above"
                    className="w-full px-3 py-2 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white"
                  />
                </div>
                <button
                  onClick={grantLifetimeAccess}
                  disabled={loading || !targetUserId}
                  className="bg-gradient-to-r from-orange-600 to-amber-600 text-white px-6 py-3 rounded-lg font-medium hover:from-orange-700 hover:to-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-md"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Granting Access...
                    </>
                  ) : (
                    <>
                      <Crown className="h-4 w-4 mr-2" />
                      Grant Lifetime Access
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-blue-600" />
                Add Premium Subscription
              </h2>
              <p className="text-gray-700 mb-4">
                Add a monthly premium subscription to a specific user (useful for manual corrections). User ID will be auto-filled if you searched for a user above.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    Target User ID
                  </label>
                  <input
                    type="text"
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    placeholder="Enter user ID (UUID) or search for user above"
                    className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                  />
                </div>
                <button
                  onClick={addSubscription}
                  disabled={addSubLoading || !targetUserId}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-md"
                >
                  {addSubLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Adding Subscription...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Add Premium Subscription
                    </>
                  )}
                </button>
              </div>
            </div>

            {message && (
              <div className={`rounded-lg p-4 ${
                message.includes('✅') 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message}
              </div>
            )}

            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-amber-600" />
                Admin Instructions
              </h2>
              <ul className="space-y-3 text-gray-800">
                <li className="flex items-start">
                  <span className="text-amber-600 mr-3 mt-1">•</span>
                  <span>Use <strong className="text-gray-900">Search User</strong> to find users by email and auto-fill their User ID</span>
                </li>
                <li className="flex items-start">
                  <span className="text-amber-600 mr-3 mt-1">•</span>
                  <span>Use <strong className="text-gray-900">Lifetime Access</strong> for special users who should have permanent premium access</span>
                </li>
                <li className="flex items-start">
                  <span className="text-amber-600 mr-3 mt-1">•</span>
                  <span>Use <strong className="text-gray-900">Premium Subscription</strong> for manual corrections when Stripe webhooks fail</span>
                </li>
                <li className="flex items-start">
                  <span className="text-amber-600 mr-3 mt-1">•</span>
                  <span>User IDs can also be found in the Supabase dashboard under the users table</span>
                </li>
                <li className="flex items-start">
                  <span className="text-amber-600 mr-3 mt-1">•</span>
                  <span>Changes take effect immediately after successful API calls</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
