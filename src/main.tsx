import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/index.css'
import App from './App'
import { SpeedInsights } from "@vercel/speed-insights/next"

ReactDOM.createRoot(document.getElementById('root')!).render(
  <>
    <SpeedInsights></SpeedInsights>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </>,
)