import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";
import "@github/spark/spark"

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'

import "./main.css"
import "./styles/theme.css"
import "./index.css"

const rootEl = document.getElementById('root')

if (!rootEl) {
  document.body.innerHTML = '<div style="padding:20px;color:#b91c1c;background:#fff7f7">Error: root element not found</div>'
} else {
  try {
    createRoot(rootEl).render(
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <App />
      </ErrorBoundary>
    )
  } catch (err: any) {
    // Ensure any early runtime error displays in the page instead of a blank screen
    console.error('Render error:', err)
    rootEl.innerHTML = `<pre style="white-space:pre-wrap;color:#b91c1c;padding:16px;background:#fff7f7">Render error:\n${String(err)}</pre>`
  }
}
