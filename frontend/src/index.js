import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

import { ToastContainer } from 'react-toastify';   // {/* Notification library */}
import 'react-toastify/dist/ReactToastify.css';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
    
    {/* Notification container */}
    <ToastContainer               
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      closeOnClick
      pauseOnHover
      draggable
    />
                    
  </React.StrictMode>
);