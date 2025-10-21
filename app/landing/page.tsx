"use client"

import Link from "next/link"
import { motion, useScroll, useTransform, useInView } from "framer-motion"
import { useRef, useEffect, useState } from "react"
import { 
  TrendingUp, 
  Calculator, 
  Brain, 
  BarChart3, 
  Target, 
  Zap,
  ArrowRight,
  CheckCircle,
  Star,
  Users,
  DollarSign,
  Clock
} from "lucide-react"

// Animated background particles component
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-indigo-200/30 rounded-full"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 50 - 25, 0],
          }}
          transition={{
            duration: 8 + Math.random() * 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}

// Animated gradient background
function AnimatedBackground() {
  return (
    <motion.div
      className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50"
      animate={{
        background: [
          "linear-gradient(135deg, #eef2ff 0%, #ffffff 50%, #faf5ff 100%)",
          "linear-gradient(135deg, #f0f9ff 0%, #ffffff 50%, #fef3c7 100%)",
          "linear-gradient(135deg, #eef2ff 0%, #ffffff 50%, #faf5ff 100%)",
        ],
      }}
      transition={{
        duration: 10,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  )
}

// Counter animation hook
function useCountUp(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (isInView) {
      let startTime: number
      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime
        const progress = Math.min((currentTime - startTime) / duration, 1)
        setCount(Math.floor(progress * end))
        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }
      requestAnimationFrame(animate)
    }
  }, [isInView, end, duration])

  return { count, ref }
}

// Animated statistics component
function AnimatedStat({ icon: Icon, value, label, suffix = "" }: {
  icon: any
  value: number
  label: string
  suffix?: string
}) {
  const { count, ref } = useCountUp(value)

  return (
    <motion.div
      ref={ref}
      className="text-center"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
    >
      <motion.div
        className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4"
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <Icon className="w-8 h-8 text-indigo-600" />
      </motion.div>
      <div className="text-3xl font-bold text-gray-900 mb-2">
        {count}{suffix}
      </div>
      <div className="text-gray-600">{label}</div>
    </motion.div>
  )
}

// Enhanced feature card with animations
function AnimatedFeature({ 
  icon: Icon, 
  title, 
  desc, 
  delay = 0 
}: { 
  icon: any
  title: string
  desc: string
  delay?: number
}) {
  return (
    <motion.div
      className="group relative p-8 rounded-2xl border border-gray-200 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-300"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      whileHover={{ 
        y: -10,
        scale: 1.02,
        transition: { type: "spring", stiffness: 300 }
      }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      />
      <motion.div
        className="relative"
        whileHover={{ rotate: 5 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-xl mb-6 group-hover:bg-indigo-200 transition-colors">
          <Icon className="w-6 h-6 text-indigo-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{desc}</p>
      </motion.div>
    </motion.div>
  )
}

// Animated CTA button
function AnimatedButton({ 
  children, 
  href, 
  variant = "primary",
  className = ""
}: {
  children: React.ReactNode
  href: string
  variant?: "primary" | "secondary"
  className?: string
}) {
  const isExternal = href.startsWith("mailto:")
  
  const buttonContent = (
    <motion.div
      className={`
        inline-flex items-center justify-center px-8 py-4 rounded-xl font-semibold text-lg
        transition-all duration-300 relative overflow-hidden group
        ${variant === "primary" 
          ? "bg-indigo-600 text-white shadow-lg hover:shadow-indigo-500/25" 
          : "border-2 border-gray-300 text-gray-800 hover:border-indigo-300 hover:bg-indigo-50"
        }
        ${className}
      `}
      whileHover={{ 
        scale: 1.05,
        transition: { type: "spring", stiffness: 300 }
      }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
        initial={{ x: "-100%" }}
        whileHover={{ x: "100%" }}
        transition={{ duration: 0.6 }}
      />
      <span className="relative z-10 flex items-center gap-2">
        {children}
        <motion.div
          animate={{ x: [0, 5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <ArrowRight className="w-5 h-5" />
        </motion.div>
      </span>
    </motion.div>
  )

  if (isExternal) {
    return <a href={href}>{buttonContent}</a>
  }

  return <Link href={href}>{buttonContent}</Link>
}

export default function LandingPage() {
  const { scrollY } = useScroll()
  const headerY = useTransform(scrollY, [0, 100], [0, -50])
  const headerOpacity = useTransform(scrollY, [0, 100], [1, 0.8])
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const unsubscribe = scrollY.onChange((latest) => {
      setIsScrolled(latest > 50)
    })
    return unsubscribe
  }, [scrollY])

  return (
    <main className="min-h-screen bg-white relative overflow-hidden">
      <AnimatedBackground />
      <FloatingParticles />
      
      {/* Animated Navigation */}
      <motion.header 
        className="fixed top-0 left-0 right-0 z-50 border-b bg-white/80 backdrop-blur-md"
        style={{ y: headerY, opacity: headerOpacity }}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-center">
          <motion.div 
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Link href="/landing">
              <img 
                src="/flavor-pulse-logo.png" 
                alt="Flavor Pulse Logo" 
                className="h-8 w-auto cursor-pointer hover:opacity-80 transition-opacity"
              />
            </Link>
          </motion.div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.h1 
              className="text-5xl sm:text-7xl font-extrabold tracking-tight text-gray-900 mb-8"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
            >
              <motion.span
                className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{
                  backgroundSize: "200% 200%",
                }}
              >
                Flavor Pulse
              </motion.span>
              <br />
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                Your AI Restaurant Consultant
              </motion.span>
            </motion.h1>
          </motion.div>

          <motion.p 
            className="text-xl sm:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            Transform Your Restaurant's Bottom Line with AI-Powered Cost Management
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-20"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            <AnimatedButton href="mailto:info@flavorpulse.net" variant="primary">
              Contact Us
            </AnimatedButton>
            <AnimatedButton href="/inventory" variant="secondary">
              Try Demo
            </AnimatedButton>
          </motion.div>

          {/* Feature Cards */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <AnimatedFeature
              icon={Calculator}
              title="Live Costing"
              desc="Auto-updated ingredient prices with per-serving cost and profit insights."
              delay={0}
            />
            <AnimatedFeature
              icon={BarChart3}
              title="Smart Exports"
              desc="Share exact table views to CSV/Excel with one click for managers."
              delay={0.2}
            />
            <AnimatedFeature
              icon={Brain}
              title="AI Menu Ideas"
              desc="Generate seasonal, cost-effective menu items based on your cuisine."
              delay={0.4}
            />
          </motion.div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="relative py-20 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Trusted by Restaurants Worldwide
            </h2>
            <p className="text-xl text-gray-600">
              See the impact of AI-powered cost management
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <AnimatedStat icon={DollarSign} value={2.5} label="Average Cost Savings" suffix="M" />
            <AnimatedStat icon={TrendingUp} value={35} label="Profit Increase" suffix="%" />
            <AnimatedStat icon={Clock} value={24} label="Hours Saved Weekly" suffix="hrs" />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Modern Restaurants
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to optimize costs, maximize profits, and streamline operations
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Target,
                title: "Profitability Analysis",
                desc: "Real-time profit margin calculations with ingredient cost tracking"
              },
              {
                icon: Zap,
                title: "Smart Substitutions",
                desc: "AI-powered ingredient alternatives to reduce costs without compromising quality"
              },
              {
                icon: BarChart3,
                title: "Predictive Analytics",
                desc: "Forecast demand and optimize inventory with machine learning insights"
              },
              {
                icon: Calculator,
                title: "Menu Optimization",
                desc: "Generate new menu items based on cost efficiency and customer preferences"
              },
              {
                icon: TrendingUp,
                title: "Price Monitoring",
                desc: "Track ingredient price fluctuations and get alerts for cost-saving opportunities"
              },
              {
                icon: CheckCircle,
                title: "Automated Reports",
                desc: "Generate comprehensive cost analysis reports with one click"
              }
            ].map((feature, index) => (
              <AnimatedFeature
                key={index}
                icon={feature.icon}
                title={feature.title}
                desc={feature.desc}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Transform Your Restaurant?
            </h2>
            <p className="text-xl text-indigo-100 max-w-2xl mx-auto">
              Join hundreds of restaurants already saving thousands with AI-powered cost management
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <motion.footer 
        className="border-t bg-gray-50"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-6xl mx-auto px-6 py-8 text-sm text-gray-500 flex flex-col sm:flex-row items-center justify-between">
          <motion.span
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            © {new Date().getFullYear()} FlavorPulse
          </motion.span>
          <div className="flex items-center space-x-6 mt-4 sm:mt-0">
            <motion.a 
              href="mailto:info@flavorpulse.net" 
              className="hover:text-gray-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              Contact
            </motion.a>
            <motion.a 
              href="/demo" 
              className="hover:text-gray-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              Demo
            </motion.a>
          </div>
        </div>
      </motion.footer>
    </main>
  )
}