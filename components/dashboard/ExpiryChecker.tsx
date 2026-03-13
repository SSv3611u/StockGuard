'use client'

import { useEffect } from 'react'

export default function ExpiryChecker() {
  useEffect(() => {
    // Trigger the expiry alert check whenever the dashboard is loaded/refreshed
    // We hit the endpoint with the secret if available, or just hit it (since we relaxed auth for dev/hackathon)
    const triggerCheck = async () => {
      try {
        await fetch('/api/cron/expiry-alert', {
          headers: {
            // We use the same secret from env if possible, 
            // but in a client component we can't see server-side env vars unless NEXT_PUBLIC.
            // For the hackathon, we'll allow the GET request to proceed if the secret check is relaxed.
            'Authorization': 'Bearer hackathon-secret-123' 
          }
        })
      } catch (err) {
        console.error('Failed to trigger automatic expiry check:', err)
      }
    }

    triggerCheck()
  }, [])

  return null // This component doesn't render anything
}
