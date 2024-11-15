import React, { useState, useEffect, useRef } from 'react';

const Noticias = () => {
  const [noticias, setNoticias] = useState([]);
  const [error, setError] = useState(null);
  const [noticiaActual, setNoticiaActual] = useState(0);
  const [estaLeyendo, setEstaLeyendo] = useState(false);
  const [paginaCargada, setPaginaCargada] = useState(false);
  const [velocidadLectura, setVelocidadLectura] = useState(1.0);
  const [tamanoLetra, setTamanoLetra] = useState(1);
  const noticiaRefs = useRef([]);
  const instruccionesRef = useRef(null);
  const reconocimientoVoz = useRef(null);
  const [reconocimientoHabilitado, setReconocimientoHabilitado] = useState(false);
  const estaEscuchandoRef = useRef(false);

  const traducirTexto = async (texto) => {
    return new Promise((resolve) => {
      setTimeout(async () => {
        try {
          const response = await fetch(`https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=en&to=es`, {
            method: 'POST',
            headers: {
              'Ocp-Apim-Subscription-Key': '39EJ4BedVe6b6DsnyhEv4ofrVfqMe7HFluwIvuDDzJazM1cGJ51tJQQJ99AKACZoyfiXJ3w3AAAbACOGP7Xi',
              'Ocp-Apim-Subscription-Region': 'brazilsouth',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify([{ Text: texto }])
          });
          const data = await response.json();
          resolve(data[0]?.translations[0]?.text || texto);
        } catch (error) {
          console.error('Error al traducir:', error);
          resolve(texto); // En caso de error, devuelve el texto sin traducir
        }
      }, 500); // Pausa de 500 ms entre cada solicitud para evitar límite
    });
  };


  // Función para ajustar el tamaño de letra
  const ajustarTamanoLetra = (accion) => {
    setTamanoLetra(prevTamano => {
      let nuevoTamano;
      if (accion === 'aumentar') {
        nuevoTamano = Math.min(prevTamano + 0.1, 2);
        leerTexto('Tamaño de letra aumentado', true, true);
      } else {
        nuevoTamano = Math.max(prevTamano - 0.1, 0.8);
        leerTexto('Tamaño de letra reducido', true, true);
      }
      return Number(nuevoTamano.toFixed(1));
    });
  };

  // Función para leer el texto en voz alta
  const leerTexto = (texto, interrumpir = true, prioridad = false) => {
    if (interrumpir) {
      speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = 'es-ES';
    utterance.rate = velocidadLectura;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    const voces = speechSynthesis.getVoices();
    const vozEspanol = voces.find(voz => voz.lang.startsWith('es'));
    if (vozEspanol) {
      utterance.voice = vozEspanol;
    }

    if (prioridad) {
      speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => speechSynthesis.speak(utterance), 250);
    }

    return utterance;
  };

  // Manejo de teclas para cambiar la velocidad de lectura y tamaño de letra
  useEffect(() => {
    const manejarTeclasVelocidad = (e) => {
      if (e.key === 'ArrowLeft') {
        setVelocidadLectura((prevVelocidad) => {
          const nuevaVelocidad = Math.max(0.5, prevVelocidad - 0.5);
          leerTexto(`Velocidad ajustada a ${nuevaVelocidad}x`, true, true);
          return nuevaVelocidad;
        });
      } else if (e.key === 'ArrowRight') {
        setVelocidadLectura((prevVelocidad) => {
          const nuevaVelocidad = Math.min(2.0, prevVelocidad + 0.5);
          leerTexto(`Velocidad ajustada a ${nuevaVelocidad}x`, true, true);
          return nuevaVelocidad;
        });
      }
    };

    const manejarTeclasTexto = (e) => {
      if (e.ctrlKey) {
        if (e.key === 'l' || e.key === 'L') {
          e.preventDefault();
          ajustarTamanoLetra('aumentar');
        } else if (e.key === 'k' || e.key === 'K') {
          e.preventDefault();
          ajustarTamanoLetra('reducir');
        }
      }
    };

    window.addEventListener('keydown', manejarTeclasVelocidad);
    window.addEventListener('keydown', manejarTeclasTexto);
    return () => {
      window.removeEventListener('keydown', manejarTeclasVelocidad);
      window.removeEventListener('keydown', manejarTeclasTexto);
    };
  }, []);

  // Aplicar el tamaño de letra dinámicamente
  useEffect(() => {
    document.documentElement.style.setProperty('--font-scale', tamanoLetra.toString());
  }, [tamanoLetra]);

  useEffect(() => {
    if (estaLeyendo) {
      leerTexto(noticias[noticiaActual]?.title + '. ' + noticias[noticiaActual]?.description, true);
    }
  }, [velocidadLectura, noticiaActual, estaLeyendo]);

  const leerBienvenida = () => {
    const mensajeBienvenida = `
      Bienvenido al lector de noticias accesible..
      al apretar la letr H puedes escuchar las intrucciones de como podes usar nuestra pagina web
      si no puedes precionar Z para encender Comando de voz y los comando de voz son: Siguente, Anterior, Repetir, Abrir Noticia.
    `;
    leerTexto(mensajeBienvenida, true, true);
  };

  const leerIntrucciones = () => {
    const mensajeBienvenida = `
      Se han cargado ${noticias.length} noticias para tu lectura.
      Para ayudarte a navegar, aquí están las instrucciones:
      Usa la flecha hacia arriba para ir a la noticia anterior.
      Usa la flecha hacia abajo para ir a la siguiente noticia.
      Presiona la barra espaciadora para escuchar la noticia actual o detener la lectura.
      Presiona Enter para abrir el enlace de la noticia en una nueva ventana.
      Presiona la tecla H en cualquier momento para escuchar estas instrucciones nuevamente.
      Presiona la tecla M para silenciar todas las lecturas.
      Presiona la tecla R para repetir la última noticia leída.
      Control más L para aumentar el tamaño de letra.
      Control más K para reducir el tamaño de letra.
      Estás en la primera noticia. Presiona la barra espaciadora para comenzar a escucharla.
      Z: Comando de voz
      X: Detener Comando de voz
    `;
    leerTexto(mensajeBienvenida, true, true);
  };

  const fetchNoticias = async () => {
    try {
      const url = 'https://newsapi.org/v2/top-headlines?country=us&apiKey=b8b172d440e34e69a222e7cb7037140e';
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'ok' && data.articles?.length > 0) {
        // Limitar el procesamiento a las primeras 5 noticias para no exceder el límite
        const noticiasTraducidas = [];

        for (let i = 0; i < 5 && noticiasTraducidas.length < 3; i++) {
          const noticia = data.articles[i];
          const title = await traducirTexto(noticia.title);
          const description = await traducirTexto(noticia.description || "");

          noticiasTraducidas.push({
            title,
            description,
            url: noticia.url,
            imageUrl: noticia.urlToImage // Agregar la URL de la imagen
          });
        }

        if (noticiasTraducidas.length >= 3) {
          setNoticias(noticiasTraducidas);
          setPaginaCargada(true);
        } else {
          setError('No se pudieron traducir suficientes noticias. Intente nuevamente más tarde.');
        }
      } else {
        setError('No se pudieron cargar las noticias. Por favor, intente más tarde.');
      }
    } catch (error) {
      setError('Hubo un problema al conectar con el servidor. Por favor, verifique su conexión a internet.');
    }
  };

  useEffect(() => {
    fetchNoticias();
  }, []);

  useEffect(() => {
    if (paginaCargada && noticias.length > 0) {
      setTimeout(() => {
        leerBienvenida();
        if (instruccionesRef.current) {
          instruccionesRef.current.focus();
        }
      }, 500);
  
      // Leer la primera noticia automáticamente
      const primeraNoticia = noticias[0];
      if (primeraNoticia) {
        const texto = `Primera noticia: ${primeraNoticia.title}. ${primeraNoticia.description || ''}`;
        leerTexto(texto, true, true);
      }
    }
  }, [paginaCargada, noticias]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          navegarNoticias('siguiente');
          break;
        case 'ArrowUp':
          e.preventDefault();
          navegarNoticias('anterior');
          break;
        case ' ':
          e.preventDefault();
          toggleLectura();
          break;
        case 'Enter':
          e.preventDefault();
          abrirNoticia();
          break;
        case 'h':
        case 'H':
          e.preventDefault();
          leerIntrucciones();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          speechSynthesis.cancel();
          leerTexto('Lectura detenida', true, true);
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          repetirNoticia();
          break;
        case 'z':
        case 'Z':
          e.preventDefault();
          iniciarReconocimientoVoz();
          break;
        case 'x':
        case 'X':
          e.preventDefault();
          detenerReconocimientoVoz();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [noticiaActual, noticias]);

  // Función para navegar entre noticias
  const navegarNoticias = (direccion) => {
    speechSynthesis.cancel();

    setNoticiaActual((prevNoticiaActual) => {
      let nuevaNoticia = prevNoticiaActual;

      if (direccion === 'siguiente' && prevNoticiaActual < noticias.length - 1) {
        nuevaNoticia = prevNoticiaActual + 1;
      } else if (direccion === 'anterior' && prevNoticiaActual > 0) {
        nuevaNoticia = prevNoticiaActual - 1;
      } else {
        const mensaje =
          direccion === 'siguiente' ? 'Has llegado a la última noticia' : 'Has llegado a la primera noticia';
        leerTexto(mensaje, true, true);
        return prevNoticiaActual; // Retorna el mismo índice si no se puede avanzar
      }

      const mensaje = `Noticia ${nuevaNoticia + 1} de ${noticias.length}. ${noticias[nuevaNoticia].title}`;
      leerTexto(mensaje, true, true);

      return nuevaNoticia;
    });
  };

  const repetirNoticia = () => {
    // Cancela cualquier lectura en curso
    speechSynthesis.cancel();

    // Utiliza el estado actual de `noticiaActual` para obtener la noticia actual
    setNoticiaActual((prevNoticiaActual) => {
      const noticia = noticias[prevNoticiaActual]; // Usa la noticia actualizada
      if (noticia) {
        const texto = `Repitiendo noticia ${prevNoticiaActual + 1} de ${noticias.length}. ${noticia.title}. ${noticia.description || ''}`;
        leerTexto(texto, true, true); // Lee la noticia actualizada y maneja el reconocimiento de voz
      }
      return prevNoticiaActual; // Retorna el mismo índice para mantener la noticia actual
    });
  };

  useEffect(() => {
    if (noticiaRefs.current[noticiaActual]) {
      noticiaRefs.current[noticiaActual].focus();
      noticiaRefs.current[noticiaActual].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [noticiaActual]);

  const toggleLectura = () => {
    setEstaLeyendo(!estaLeyendo);
    const noticia = noticias[noticiaActual];
    if (!estaLeyendo && noticia) {
      const texto = `${noticia.title}. ${noticia.description || ''}`;
      leerTexto(texto, true, true);
    } else {
      speechSynthesis.cancel();
      leerTexto('Lectura pausada', true, true);
    }
  };

  const abrirNoticia = () => {
    const noticia = noticias[noticiaActual];
    if (noticia && noticia.url) {
      window.open(noticia.url, '_blank');
      leerTexto('Abriendo noticia en una nueva ventana. Puedes volver a esta página con Alt + Tab.');
    }
  };
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      leerTexto("Tu navegador no soporta el reconocimiento de voz.");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = false;

    // Variable para controlar si el reconocimiento de voz debería estar activo
    let estaEscuchando = false;

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
      procesarComandoVoz(transcript);
    };

    recognition.onend = () => {
      // Verificar si debería seguir escuchando
      if (estaEscuchando) {
        recognition.start(); // Reiniciar el reconocimiento de voz
      }
    };

    reconocimientoVoz.current = recognition;
    setReconocimientoHabilitado(true);

    return () => {
      recognition.stop();
    };
  }, []);

  const procesarComandoVoz = (comando) => {
    if (comando.includes("siguiente")) {
      navegarNoticias("siguiente");
    } else if (comando.includes("anterior")) {
      navegarNoticias("anterior");
    } else if (comando.includes("repetir")) {
      repetirNoticia();
    } else if (comando.includes("abrir noticia")) {
      abrirNoticia();
    } else {
      leerTexto("Comando no reconocido.");
    }
  };
  const iniciarReconocimientoVoz = () => {
    if (reconocimientoHabilitado && reconocimientoVoz.current) {
      reconocimientoVoz.current.start();
      leerTexto("Reconocimiento de voz activado.");
      estaEscuchandoRef.current = true; // Actualizamos la referencia
    }
  };

  const detenerReconocimientoVoz = () => {
    if (reconocimientoVoz.current) {
      reconocimientoVoz.current.stop();
      leerTexto("Reconocimiento de voz desactivado.");
      estaEscuchandoRef.current = false; // Actualizamos la referencia
    }
  };
  return (
    <main className="noticias-container" role="main" style={{ fontSize: `${tamanoLetra}rem` }}>
      <h1 tabIndex="0">Lector de Noticias Accesible</h1>

      {error && (
        <div className="error-container" role="alert" aria-live="assertive">
          <p className="error">{error}</p>
        </div>
      )}

      <div
        ref={instruccionesRef}
        className="instrucciones"
        role="region"
        aria-label="Instrucciones de navegación"
        tabIndex="0"
      >
        <h2>Instrucciones de Navegación</h2>
        <ul>
          <li>Flechas ↑↓: Navegar entre noticias</li>
          <li>Flechas ←→: Cambiar velocidad de lectura</li>
          <li>ESPACIO: Leer/pausar noticia actual</li>
          <li>ENTER: Abrir enlace de la noticia</li>
          <li>H: Escuchar instrucciones</li>
          <li>M: Silenciar todas las lecturas</li>
          <li>R: Repetir última noticia</li>
          <li>Control + L: Aumentar tamaño de letra</li>
          <li>Control + K: Reducir tamaño de letra</li>
          <li>Z: Comando de voz: "Siguente", "Anterior", "Repetir", "Abrir Noticia"</li>
          <li>X: Detener Comando de voz</li>
        </ul>
        <p>Total de noticias disponibles: {noticias.length}</p>
        <p>Tamaño de letra actual: {(tamanoLetra * 100).toFixed(0)}%</p>
      </div>

      {noticias.length > 0 ? (
        <section role="feed" aria-label="Lista de noticias" className="noticias-lista">
          {noticias.map((article, index) => (
            <article
              key={index}
              ref={el => noticiaRefs.current[index] = el}
              className={`noticia ${index === noticiaActual ? 'noticia-activa' : ''}`}
              role="article"
              aria-selected={index === noticiaActual}
              tabIndex={index === noticiaActual ? 0 : -1}
              aria-label={`Noticia ${index + 1} de ${noticias.length}`}
            >
              {article.imageUrl && article.imageUrl.trim() && (
                <img
                  src={article.imageUrl}
                  alt={article.title || "Imagen de la noticia"}
                  className="noticia-img"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.alt = 'Error al cargar la imagen';
                  }}
                />
              )}
              <h2>{article.title}</h2>
              <p>{article.description}</p>
              <div className="noticia-meta">
                <p className="noticia-fecha">{new Date(article.publishedAt).toLocaleDateString('es-ES')}</p>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="noticia-enlace"
                  aria-label={`Leer más sobre: ${article.title}`}
                >
                  Leer artículo completo
                </a>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <p role="status" aria-live="polite">Cargando noticias...</p>
      )}
    </main>
  );

};

export default Noticias;