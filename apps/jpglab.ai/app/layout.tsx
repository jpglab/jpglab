import './globals.css'
import { Jersey_10 } from 'next/font/google'

const jersey10 = Jersey_10({
  subsets: ['latin'],
  variable: '--font-jersey',
  weight: ['400']
})

export const metadata = {
  title: 'jpglab',
  description: 'jpglab',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
      <html lang="en" className="h-screen overflow-hidden w-full m-0 p-0 bg-simulation-bg">
          <head>
              <meta charSet="utf-8" />
              <link rel="icon" type="image/svg+xml" href="/jpglab.png" />
              <meta name="viewport" content="width=device-width" />
              <title>jpglab</title>
              <meta
                  name="description"
                  content="we're building a protocol for large language models to directly interface with image sensors."
              />
              <meta property="og:title" content="jpglab" />
              <meta
                  property="og:description"
                  content="we're building a protocol for large language models to directly interface with image sensors."
              />
              <meta property="og:image" content="https://jpglab.ai/og.png" />
              <meta property="og:type" content="website" />
              <meta property="og:url" content="https://jpglab.ai" />
              <meta name="twitter:card" content="summary_large_image" />
          </head>
          <body
              className={`${jersey10.variable} flex flex-col overflow-hidden w-full h-screen relative m-0 p-0 border-none bg-simulation-bg`}
          >
              {children}
          </body>
      </html>
  )
}
