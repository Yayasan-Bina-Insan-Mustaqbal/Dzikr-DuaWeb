import { useEffect } from 'react'
import formbricks from '@formbricks/js'

export function FormbricksProvider() {
  useEffect(() => {
    // Only initialize if window exists to prevent SSR hydration mismatches
    if (typeof window !== 'undefined') {
      const environmentId = import.meta.env.VITE_FORMBRICKS_ENVIRONMENT_ID
      const apiHost = import.meta.env.VITE_FORMBRICKS_API_HOST

      if (environmentId && apiHost) {
        formbricks.setup({
          environmentId,
          appUrl: apiHost,
        })
      }
    }
  }, [])

  return null // This component renders no UI
}
