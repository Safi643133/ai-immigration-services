'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function DashboardPage() {
  const { user, profile, signOut, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user && !loading) {
      router.push('/login')
    }
  }, [user, loading, router])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                AI Immigration Agent
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {profile?.avatar_url && (
                  <img
                    className="h-8 w-8 rounded-full"
                    src={profile.avatar_url}
                    alt={profile.full_name || 'User'}
                  />
                )}
                <span className="text-sm text-gray-700">
                  {profile?.full_name || user.email}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Welcome to AI Immigration Agent
              </h2>
              <p className="text-gray-600 mb-8">
                Upload your documents and let our AI agent automatically fill your immigration forms.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Upload Documents
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Upload passports, visas, education certificates, and other supporting documents.
                  </p>
                  <button 
                  onClick={() => router.push('/upload')}
                  className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
                    Start Upload
                  </button>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    View Documents
                  </h3>
                  <p className="text-gray-600 mb-4">
                    View and manage your uploaded documents.
                  </p>
                  <button 
                    onClick={() => router.push('/documents')}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                  >
                    View Documents
                  </button>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Fill Forms
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Auto-fill immigration forms with your extracted data.
                  </p>
                  <button 
                    onClick={() => router.push('/forms')}
                    className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                  >
                    Fill Forms
                  </button>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    View Submissions
                  </h3>
                  <p className="text-gray-600 mb-4">
                    View and download your previously generated forms.
                  </p>
                  <button 
                    onClick={() => router.push('/submissions')}
                    className="w-full bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700"
                  >
                    View Submissions
                  </button>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-lg border">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Review & Submit
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Review auto-filled forms and submit when ready.
                  </p>
                  <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                    Review Forms
                  </button>
                </div>
              </div>

              {profile && (
                <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    User Profile
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Name:</span>
                      <span className="ml-2 text-gray-900">{profile.full_name || 'Not set'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Email:</span>
                      <span className="ml-2 text-gray-900">{profile.email}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Role:</span>
                      <span className="ml-2 text-gray-900 capitalize">{profile.role}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Member since:</span>
                      <span className="ml-2 text-gray-900">
                        {new Date(profile.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 