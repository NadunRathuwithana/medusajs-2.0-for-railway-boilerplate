"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Lock, ArrowRight, Loader2, X, User } from "lucide-react"
import Image from "next/image"
import { submitLogin } from "./actions"

export default function ComingSoonPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showLogin, setShowLogin] = useState(false)

  async function onSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await submitLogin(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 overflow-hidden font-sans">
      {/* Background Image */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url("/coming-soon.jpg")' }}
      />
      
      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center mt-[-5vh]">
        {/* Logo */}
        <div className="mb-12">
          <Image 
            src="/cardle-premium-cotton-tote-bags-logo.png" 
            alt="Cardle Logo" 
            width={200} 
            height={80} 
            className="h-auto w-auto max-h-24 object-contain"
            priority
          />
        </div>

        {/* Heading */}
        <h1 
          className="text-6xl md:text-7xl mb-6 text-[#634b41] font-normal" 
          style={{ fontFamily: 'Georgia, "Times New Roman", serif', lineHeight: '1.1' }}
        >
          Launching<br />soon!
        </h1>

        {/* Subtitle */}
        <p className="text-[#634b41] text-lg mb-10 max-w-md font-medium tracking-wide">
          We are currently working on our NEW official website!
        </p>

        {/* Button */}
        <button className="bg-white text-[#634b41] px-8 py-3 rounded-full font-semibold tracking-widest text-sm shadow-[0_4px_14px_0_rgba(0,0,0,0.05)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-300 mb-16">
          STAY TUNED
        </button>

        {/* Social Icons */}
        <div className="flex gap-4">
          <a 
            href="https://www.instagram.com/cardle_lk" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="w-12 h-12 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors text-[#634b41]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
              <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
            </svg>
          </a>
        </div>
      </div>

      {/* Hidden Login Trigger */}
      <button 
        onClick={() => setShowLogin(true)}
        className="absolute bottom-4 text-[10px] text-[#634b41]/30 hover:text-[#634b41]/80 transition-colors tracking-widest uppercase z-20"
      >
        Admin Access
      </button>

      {/* Login Popup */}
      <AnimatePresence>
        {showLogin && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md relative"
            >
              <button 
                onClick={() => setShowLogin(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2 transition-colors rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-8 mt-2">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Storefront Preview</h2>
                <p className="text-gray-500 text-sm">Provide credentials to access the preview environment.</p>
              </div>

              <form action={onSubmit} className="space-y-4">
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="username"
                      required
                      placeholder="Username"
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 sm:text-sm transition-all duration-200"
                    />
                  </div>
                </div>
                
                <div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      name="password"
                      required
                      placeholder="Password"
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 sm:text-sm transition-all duration-200"
                    />
                  </div>
                </div>

                {error && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="text-red-600 text-sm text-center bg-red-50 py-2 rounded-lg border border-red-100"
                  >
                    {error}
                  </motion.p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-[#634b41] hover:bg-[#4a3730] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#634b41] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group mt-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Access Storefront
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
