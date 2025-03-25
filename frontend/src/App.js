import logo from './logo.svg';
import './App.css';
import { Outlet } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import { ToastContainer } from 'react-toastify';
import { CartProvider } from './context/CartContext';

function App() {
  return (
    <CartProvider>
    <ToastContainer />
    <Header/>
    <Outlet/>
    <Footer/>
    </CartProvider>
  );
}

export default App;
