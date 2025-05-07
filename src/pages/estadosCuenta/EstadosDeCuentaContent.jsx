import React from 'react';

export const EstadosDeCuentaContent = ({ userInfo }) => {
  return (
    <div>
      <h1>Estados de Cuenta</h1>
      <p>Aquí se mostrará la información de los estados de cuenta.</p>
      {/* Contenido futuro */}
      {userInfo && <p>Vista de estados de cuenta para: {userInfo.userName}</p>}
    </div>
  );
};