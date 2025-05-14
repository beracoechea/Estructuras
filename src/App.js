import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Auth } from './pages/auth/index'; 
import { Estructuras } from './pages/estructuras/index';
import { EstructuraDetalle } from './pages/estructuras/detalle';
import {ExpedienteDetalle} from './pages/expedientes/ExpedienteDetalle';

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" exact element={<Auth/>}/>
          <Route path="/estructuras" exact element={<Estructuras/>} />
          <Route path="/estructuras/detalle/:estructuraId" element={<EstructuraDetalle />} />
          <Route path="/expedientes/:expedienteId" element={<ExpedienteDetalle />} />
        </Routes>
      </Router>
 
    </div>
  );
}

export default App;
