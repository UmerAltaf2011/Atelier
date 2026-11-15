import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Shop from './pages/Shop.jsx';
import Brands from './pages/Brands.jsx';
import Wardrobe from './pages/Wardrobe.jsx';
import Quiz from './pages/Quiz.jsx';
import About from './pages/About.jsx';
import Account from './pages/Account.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="shop" element={<Shop />} />
        <Route path="brands" element={<Brands />} />
        <Route path="wardrobe" element={<Wardrobe />} />
        <Route path="quiz" element={<Quiz />} />
        <Route path="about" element={<About />} />
        <Route path="account" element={<Account />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
