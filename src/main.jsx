import React from 'react';
import{createRoot}from'react-dom/client';
import App from './App.jsx';
import AuthGate from './AuthGate.jsx';
import './styles.css';
createRoot(document.getElementById('root')).render(<React.StrictMode><AuthGate><App/></AuthGate></React.StrictMode>);

if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register(import.meta.env.BASE_URL+'sw.js').catch(error=>console.warn('Service worker registration failed',error)));}
