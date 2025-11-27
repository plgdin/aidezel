import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 pt-12 pb-24 lg:pb-8 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-center md:text-left">
          <div>
            <h3 className="text-xl font-bold text-blue-900 mb-4">Aidezel</h3>
            <p className="text-gray-500 text-sm leading-relaxed">Your premium destination for electronics and lifestyle products in the UK.</p>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-4">Shop</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to="/shop" className="hover:text-blue-600">All Products</Link></li>
              <li><Link to="/shop?cat=mobile" className="hover:text-blue-600">Mobiles</Link></li>
              <li><Link to="/new-arrivals" className="hover:text-blue-600">New Arrivals</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to="/contact" className="hover:text-blue-600">Contact Us</Link></li>
              <li><Link to="/account/orders" className="hover:text-blue-600">Order Status</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to="/terms" className="hover:text-blue-600">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="hover:text-blue-600">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-100 pt-8 text-center text-gray-400 text-sm">
          &copy; {new Date().getFullYear()} Aidezel LTD. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;