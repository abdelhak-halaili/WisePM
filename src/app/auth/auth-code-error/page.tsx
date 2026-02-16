import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const error = searchParams.error_description || "Authentication failed"
  const code = searchParams.error_code

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-xl p-8 shadow-lg text-center">
        <div className="bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-50 mb-2">
          Authentication Error
        </h1>
        
        <p className="text-slate-400 mb-8">
          {decodeURIComponent(error as string)}
        </p>

        {code === 'otp_expired' && (
             <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6 text-sm text-blue-200">
                <p><strong>Tip:</strong> Email links expire quickly for security.</p>
                <p>Try logging in again to request a new temporary link.</p>
             </div>
        )}

        <Link 
          href="/login" 
          className="inline-flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Back to Login
        </Link>
      </div>
    </div>
  )
}
