import './App.css'
import React from 'react';
import Noticias from './Noticias'; // Importamos el componente Noticias

function App() {
  return (
      <div className="App">
          <Noticias />  {/* Renderizamos las noticias aquí */}
      </div>
  );
}

export default App;
