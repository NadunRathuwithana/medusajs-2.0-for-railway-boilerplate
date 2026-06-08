"use client"

import { motion, Variants } from "framer-motion"
import { CheckCircle } from "lucide-react"
import { XCircle, Loader2 } from "lucide-react"

export default function AnimatedOrderComplete({ 
  children,
  status = "success",
  title,
  message
}: { 
  children?: React.ReactNode
  status?: "success" | "error" | "processing"
  title?: string
  message?: string
}) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
  }

  return (
    <motion.div 
      className="flex flex-col items-center max-w-4xl w-full mb-10"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Animated Hero Section */}
      <motion.div 
        className="w-full py-16 flex flex-col items-center justify-center"
        variants={itemVariants}
      >
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.1
          }}
          className="relative mb-6"
        >
          {status === "success" && (
            <>
              <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-60"></div>
              <CheckCircle className="w-24 h-24 text-green-500 relative z-10" strokeWidth={1.5} />
            </>
          )}
          {status === "error" && (
            <>
              <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-60"></div>
              <XCircle className="w-24 h-24 text-red-500 relative z-10" strokeWidth={1.5} />
            </>
          )}
          {status === "processing" && (
            <>
              <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-60"></div>
              <Loader2 className="w-24 h-24 text-blue-500 relative z-10 animate-spin" strokeWidth={1.5} />
            </>
          )}
        </motion.div>
        
        <motion.h1 
          className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4 text-center"
          variants={itemVariants}
        >
          {title || (status === "success" ? "Thank you!" : status === "error" ? "Payment Failed" : "Processing...")}
        </motion.h1>
        <motion.p 
          className="text-lg text-gray-500 text-center max-w-md px-4"
          variants={itemVariants}
        >
          {message || (status === "success" 
            ? "Your order was placed successfully. We're getting it ready and will let you know when it ships." 
            : status === "error"
            ? "Unfortunately, your payment could not be processed. Please try again or use a different payment method."
            : "Please wait while we confirm your payment and place your order...")}
        </motion.p>
      </motion.div>

      {/* The Details */}
      <motion.div className="w-full py-8 md:py-12 flex flex-col gap-y-10" variants={itemVariants}>
        {children}
      </motion.div>
    </motion.div>
  )
}
