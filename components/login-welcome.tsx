"use client"

import { motion, type Variants } from "framer-motion"

const container: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15, delayChildren: 0.3 },
  },
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
}

export default function LoginWelcome() {
  return (
    <motion.div
      className="text-center mb-6 lg:mb-8 lg:text-left"
      variants={container}
      initial="hidden"
      animate="visible"
    >
      <motion.h1
        variants={fadeUp}
        className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground"
      >
        Welcome back
      </motion.h1>
      <motion.p variants={fadeUp} className="mt-2 text-sm text-muted-foreground">
        Log in to continue...
      </motion.p>
    </motion.div>
  )
}
