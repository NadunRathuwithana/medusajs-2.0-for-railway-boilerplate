import { Heading } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import React from "react"

const Help = () => {
  return (
    <div className="mt-8 bg-gray-50 border border-gray-100 rounded-2xl p-6 sm:p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-black text-white p-2 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
        </div>
        <Heading className="text-xl font-bold tracking-tight text-gray-900 m-0">Need help?</Heading>
      </div>
      
      <p className="text-sm text-gray-500 mb-6">
        Have a question about your order? Check out our policies or get in touch with our support team.
      </p>

      <ul className="flex flex-col gap-3">
        <li>
          <LocalizedClientLink 
            href="/shipping"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-400 hover:shadow-md transition-all duration-300"
          >
            <span className="font-medium text-sm text-gray-600 group-hover:text-gray-600 transition-colors duration-300">
              Shipping policy
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-all duration-300 group-hover:translate-x-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </LocalizedClientLink>
        </li>
        <li>
          <LocalizedClientLink 
            href="/returns"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-400 hover:shadow-md transition-all duration-300"
          >
            <span className="font-medium text-sm text-gray-600 group-hover:text-gray-600 transition-colors duration-300">
              Return & Exchange policy
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-all duration-300 group-hover:translate-x-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </LocalizedClientLink>
        </li>
      </ul>
    </div>
  )
}

export default Help
