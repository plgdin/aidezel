import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { CartProvider } from './context/CartContext' // <--- Import this

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CartProvider> {/* <--- WRAPPER START */}
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </CartProvider> {/* <--- WRAPPER END */}
  </React.StrictMode>,
)