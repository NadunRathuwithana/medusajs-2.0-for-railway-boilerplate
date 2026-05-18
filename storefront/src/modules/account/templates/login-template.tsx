"use client"

import { useState } from "react"
import Image from "next/image"
import Register from "@modules/account/components/register"
import Login from "@modules/account/components/login"

export enum LOGIN_VIEW {
  SIGN_IN = "sign-in",
  REGISTER = "register",
}

const LoginTemplate = () => {
  const [currentView, setCurrentView] = useState("sign-in")

  return (
    <div className="w-full min-h-[calc(100vh-64px)] grid grid-cols-1 lg:grid-cols-2 bg-white">
      {/* Visual Brand Panel (Desktop only) */}
      <div className="hidden lg:flex relative flex-col justify-between p-16 bg-[#1a1a1a] text-white overflow-hidden select-none">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/cardle_login_cover.png"
            alt="Cardle Luxury Carry"
            fill
            className="object-cover opacity-70 transition-transform duration-[10000ms] hover:scale-105 ease-out"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/35 z-10" />
        </div>

        {/* Content Overlays */}
        <div className="relative z-20 flex flex-col justify-between h-full">
          <div>
            <h2 className="text-4xl font-extrabold capitalize tracking-widest mb-2 font-sans text-white">
              Cardle
            </h2>
            <p className="text-xs font-semibold tracking-[0.25em] text-gray-300 capitalize">
              Elevate Your Everyday Carry
            </p>
          </div>

          <div className="max-w-md">
            <blockquote className="text-lg font-medium leading-relaxed italic text-gray-100">
              "Unapologetically durable, minimalist carry crafted for life."
            </blockquote>
            <div className="mt-4 w-12 h-0.5 bg-white/60" />
          </div>
        </div>
      </div>

      {/* Forms Panel */}
      <div className="flex items-center justify-center p-8 sm:p-16 w-full bg-white z-10">
        <div className="w-full max-w-[420px] transition-all duration-300 animate-in fade-in duration-500">
          {currentView === "sign-in" ? (
            <Login setCurrentView={setCurrentView} />
          ) : (
            <Register setCurrentView={setCurrentView} />
          )}
        </div>
      </div>
    </div>
  )
}

export default LoginTemplate
