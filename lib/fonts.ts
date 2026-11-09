import localFont from "next/font/local"

const fontSans = localFont({
  src: [
    {
      path: "../public/fonts/mona-sans-variable-roman.woff2",
      weight: "200 900",
      style: "normal",
    },
    {
      path: "../public/fonts/mona-sans-variable-italic.woff2",
      weight: "200 900",
      style: "italic",
    },
  ],
  variable: "--font-sans",
  display: "swap",
})

export default fontSans
