import './App.css';
import { Route, Routes } from 'react-router';
import Main from './components/Main';
import Stats from './components/Stats';
import Help from './components/Help';
import Assets from './components/Assets';
import TopNavigation from './components/header/TopNavigation';
import Footer from './components/Footer';
window.Buffer = window.Buffer || require("buffer").Buffer;
function App() {
  return (
    <div className='mx-auto max-w-screen-xl max-w-[960px] md:p-2'>
        <TopNavigation />
        <div className=''>
          <Routes>
            <Route path='/' element={<Main />} />
            <Route path='/stats' element={<Stats />} />
            <Route path='/help' element={<Help />} />
            <Route path='/assets' element={<Assets />} />
          </Routes>
          <Footer />
        </div>
    </div>
  );
}
export default App;
