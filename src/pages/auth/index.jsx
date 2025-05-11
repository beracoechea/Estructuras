import { auth, provider } from '../../config/firebase-config';
import { signInWithPopup } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './Auth.css';
import logoStratego from '../../Images/caballo.png';

export const Auth = () => {
  const navigate = useNavigate();
  const allowedDomain = "@strategofirma.com";
  const [unauthorized, setUnauthorized] = useState(false);

  const signInWithGoogle = async () => {
    try {
      // Agregar el parámetro prompt al proveedor
      provider.setCustomParameters({
        prompt: 'select_account'
      });

      const results = await signInWithPopup(auth, provider);
      const email = results.user.email;

      if (email && email.endsWith(allowedDomain)) {
        const authInfo = {
          userID: results.user.uid,
          userName: results.user.displayName,
          userEmail: email,
          userPhoto: results.user.photoURL,
          isAuth: true,
        };
        localStorage.setItem("auth", JSON.stringify(authInfo));
        navigate("/extructuras");
      } else {
        console.warn(`Correo electrónico no autorizado: ${email}`);
        setUnauthorized(true);
        // Opcionalmente, puedes cerrar la sesión de Google aquí si lo deseas
        // await signOut(auth);
      }
    } catch (error) {
      console.error("Error al iniciar sesión con Google:", error);
      setUnauthorized(true); // Considera mostrar un mensaje genérico de error
    }
  };

  return (
    <div className="login-page">
      <img src={logoStratego} alt="Logotipo Stratego Firma" className="logo-stratego" />
      <h1>Stratego Firma</h1>
      <div className="login-info">
        <p>Acceso exclusivo para correos electrónicos empresariales.</p>
      </div>
      <div className="button-container">
        <button className="login-with-google-btn" onClick={signInWithGoogle}>
          Iniciar sesión con Google
        </button>
        {unauthorized && (
          <p className="unauthorized-email">
            Acceso denegado. Por favor, utiliza tu correo electrónico empresarial
          </p>
        )}
      </div>
    </div>
  );
};