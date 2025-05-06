import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Auth } from './pages/auth/index'; 
import { Estructuras } from './pages/extructuras/index';

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" exact element={<Auth/>}/>
          <Route path="/extructuras" exact element={<Estructuras/>} />
        </Routes>
      </Router>
 
    </div>
  );
}

export default App;
