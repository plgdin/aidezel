import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import ScrollToTop from './components/shared/ScrollToTop' // <--- Import

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CartProvider>
      <BrowserRouter>
        <ScrollToTop /> {/* <--- Add Here */}
        <App />
      </BrowserRouter>
    </CartProvider>
  </React.StrictMode>,
)