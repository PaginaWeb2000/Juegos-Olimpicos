// ==================== PARTICIPANTES INICIALES ====================
const defaultParticipants = [
  { name: 'Mario', gold: 0, silver: 0, bronze: 0 },
  { name: 'Sara', gold: 0, silver: 0, bronze: 0 },
  { name: 'Mateo', gold: 0, silver: 0, bronze: 0 },
  { name: 'Nil', gold: 0, silver: 0, bronze: 0 }
];

// ==================== SEGUIMIENTO DE FECHAS DE MEDALLAS ====================
function trackMedalDate(type, participantName) {
  const ahora = new Date();
  const hoy = ahora.toISOString().split('T')[0]; // Formato YYYY-MM-DD
  const timestamp = ahora.getTime(); // Marca de tiempo exacta
  
  // Obtener el historial actual de medallas (usar medalDatesHistorial, con compatibilidad hacia atrás)
  let medalDates = JSON.parse(localStorage.getItem('medalDatesHistorial') || localStorage.getItem('medalDates') || '[]');
  
  // Añadir la nueva medalla con su fecha y participante
  const newMedal = {
    date: hoy,
    timestamp: timestamp,
    type: type,
    participant: participantName
  };
  
  medalDates.push(newMedal);
  
  // Ordenar por fecha
  medalDates.sort((a, b) => a.timestamp - b.timestamp);
  
  // Guardar en localStorage (solo en medalDatesHistorial para mantener consistencia)
  localStorage.setItem('medalDatesHistorial', JSON.stringify(medalDates));
  
  // Mantener compatibilidad con código existente
  localStorage.setItem('medalDates', JSON.stringify(medalDates));
  
  // Verificar logros
  checkPuzzleAchievement(medalDates, participantName);
}

// Función para verificar el logro "Rompecabezas" (Oro, Bronce, Plata)
function checkPuzzleAchievement(medalDates, participantName) {
  // Filtrar solo las medallas de este participante
  const participantMedals = medalDates.filter(medal => medal.participant === participantName);
  
  // Necesitamos al menos 3 medallas para verificar el patrón
  if (participantMedals.length < 3) return;
  
  // Obtener las últimas 3 medallas del participante
  const lastThree = participantMedals.slice(-3);
  
  // Verificar el patrón: Oro, Bronce, Plata (gold, bronze, silver)
  const isPuzzlePattern = 
    lastThree[0].type === 'gold' &&
    lastThree[1].type === 'bronze' &&
    lastThree[2].type === 'silver';
    
  if (isPuzzlePattern) {
    // Cargar logros desbloqueados
    const unlockedAchievements = JSON.parse(localStorage.getItem('unlockedAchievements') || '{}');
    
    // Si el participante no tiene aún este logro
    if (!unlockedAchievements[participantName]) {
      unlockedAchievements[participantName] = [];
    }
    
    // Si el logro no está ya desbloqueado para este participante
    if (!unlockedAchievements[participantName].includes('puzzle')) {
      // Añadir el logro
      unlockedAchievements[participantName].push('puzzle');
      localStorage.setItem('unlockedAchievements', JSON.stringify(unlockedAchievements));
      
      // Mostrar mensaje en consola para depuración
      console.log(`¡${participantName} ha conseguido el logro 'Rompecabezas'!`);
    }
  }
}

function getBestMoments() {
  // Usar la nueva variable medalDatesHistorial
  const medalDatesHistorial = JSON.parse(localStorage.getItem('medalDatesHistorial') || '[]');
  
  // Agrupar por fecha
  const dateGroups = {};
  medalDatesHistorial.forEach(({ date }) => {
    dateGroups[date] = (dateGroups[date] || 0) + 1;
  });
  
  // Ordenar por cantidad de medallas (de mayor a menor)
  return Object.entries(dateGroups)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3); // Tomar solo los 3 mejores días
}

function resetMedalDates() {
  const mensajeAdvertencia = '¿Estás seguro de que quieres reiniciar el historial de Mejores Momentos?\n\n' +
    '⚠️ ADVERTENCIA IMPORTANTE:\n' +
    '• Se borrarán TODAS las fechas de medallas\n' +
    '• Los logros "Fiebre del Oro" y "Estrella Fugaz" se REINICIARÁN\n' +
    '• No podrás recuperar estos datos\n' +
    '• Esta acción NO SE PUEDE DESHACER\n\n' +
    '¿Deseas continuar de todos modos?';

  showConfirm(mensajeAdvertencia, function(confirmed) {
    if (confirmed) {
      // Eliminar el historial de medallas de ambos lugares para mantener consistencia
      localStorage.removeItem('medalDates');
      localStorage.removeItem('medalDatesHistorial');
      
      // Forzar la actualización de la interfaz
      if (window.location.pathname.endsWith('estadisticas.html')) {
        // Si estamos en la página de estadísticas, recargar los logros
        if (typeof cargarLogrosDestacados === 'function') {
          cargarLogrosDestacados();
        }
        // Recargar el historial reciente
        if (typeof cargarHistorialReciente === 'function') {
          cargarHistorialReciente();
        }
      }
      
      // Recargar la página para actualizar las estadísticas
      window.location.reload();
    }
  });
}

let participants = [];
let editIndex = null;

// ========== LOCAL STORAGE UTILITIES ==========
function loadParticipants() {
  // Si hay datos guardados en localStorage, los usamos
  const saved = localStorage.getItem('olimpMartinez2025');
  // Si no, usamos los participantes por defecto
  return saved ? JSON.parse(saved) : [...defaultParticipants];
}
function saveParticipants() {
  localStorage.setItem('olimpMartinez2025', JSON.stringify(participants));
  guardarHistorialClasificacion();
}

// ========== ORDENAMIENTO ESTABLE Y JERÁRQUICO ==========
function sortParticipants(list) {
  return list
    .map((p, i) => ({ ...p, origIdx: i }))
    .sort((a, b) => {
      if (b.gold !== a.gold) return b.gold - a.gold;
      if (b.silver !== a.silver) return b.silver - a.silver;
      if (b.bronze !== a.bronze) return b.bronze - a.bronze;
      return a.origIdx - b.origIdx;
    })
    .map(({ origIdx, ...rest }) => rest);
}

// ========== RENDERIZADO DE LA TABLA ==========
// Función para guardar el historial de clasificaciones y rastrear mejoras
function guardarHistorialClasificacion() {
  try {
    const historial = JSON.parse(localStorage.getItem('historialClasificacion') || '[]');
    const fechaActual = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
    
    // Obtener la clasificación actual
    const clasificacionActual = sortParticipants(participants)
      .map((p, index) => ({
        nombre: p.name,
        posicion: index + 1,
        fecha: fechaActual
      }));
    
    // Obtener la clasificación anterior (si existe)
    const clasificacionAnterior = historial.length > 0 ? 
      historial[historial.length - 1].clasificacion : [];
    
    // Inicializar o actualizar el contador de posiciones subidas
    let mejorasTotales = JSON.parse(localStorage.getItem('mejorasTotales') || '{}');
    
    // Inicializar contadores para participantes actuales si no existen
    clasificacionActual.forEach(participante => {
      if (!(participante.nombre in mejorasTotales)) {
        mejorasTotales[participante.nombre] = 0;
      }
    });
    
    // Solo procesar mejoras si hay una clasificación anterior para comparar
    if (clasificacionAnterior.length > 0) {
      // Crear un mapa de posiciones anteriores para búsqueda rápida
      const posicionesAnteriores = new Map();
      clasificacionAnterior.forEach(p => {
        posicionesAnteriores.set(p.nombre, p.posicion);
      });
      
      // Verificación para el logro "De Cero a Cien" (último a primero)
      if (clasificacionAnterior.length > 1 && clasificacionActual.length > 1) {
        const ahoraPrimero = clasificacionActual[0];
        const ultimoAnterior = clasificacionAnterior[clasificacionAnterior.length - 1];
        
        // Verificar si el que era último ahora es primero
        if (ahoraPrimero && ultimoAnterior && ahoraPrimero.nombre === ultimoAnterior.nombre) {
          let cambiosDeSuerte = JSON.parse(localStorage.getItem('cambioDeSuerte') || '{}');
          
          // Verificar que no tenga ya el logro
          if (!cambiosDeSuerte[ahoraPrimero.nombre]) {
            cambiosDeSuerte[ahoraPrimero.nombre] = true;
            localStorage.setItem('cambioDeSuerte', JSON.stringify(cambiosDeSuerte));
            
            console.log(`¡${ahoraPrimero.nombre} ha conseguido el logro 'De Cero a Cien'!`);
            
            if (typeof showNotification === 'function') {
              showNotification(`¡${ahoraPrimero.nombre} ha conseguido el logro 'De Cero a Cien'!`);
            }
          }
        }
      }
      
      // Verificación para el logro "Caída Libre" (primero a último)
      if (clasificacionAnterior.length > 1 && clasificacionActual.length > 1) {
        const primeroAnterior = clasificacionAnterior[0];
        const ahoraUltimo = clasificacionActual[clasificacionActual.length - 1];
        
        // Verificar si el que era primero ahora es último
        if (primeroAnterior && ahoraUltimo && primeroAnterior.nombre === ahoraUltimo.nombre) {
          let caidasLibres = JSON.parse(localStorage.getItem('caidasLibres') || '{}');
          
          // Verificar que no tenga ya el logro
          if (!caidasLibres[ahoraUltimo.nombre]) {
            caidasLibres[ahoraUltimo.nombre] = true;
            localStorage.setItem('caidasLibres', JSON.stringify(caidasLibres));
            
            console.log(`¡${ahoraUltimo.nombre} ha conseguido el logro 'Caída Libre'!`);
            
            if (typeof showNotification === 'function') {
              showNotification(`¡${ahoraUltimo.nombre} ha conseguido el logro 'Caída Libre'!`);
            }
          }
        }
      }
      
      // Verificar mejoras para cada participante en la clasificación actual
      clasificacionActual.forEach(actual => {
        const posicionAnterior = posicionesAnteriores.get(actual.nombre);
        
        // Si el participante estaba en la clasificación anterior
        if (posicionAnterior !== undefined) {
          const mejora = posicionAnterior - actual.posicion;
          
          // Solo sumar si ha subido posiciones (mejora > 0)
          if (mejora > 0) {
            mejorasTotales[actual.nombre] = (mejorasTotales[actual.nombre] || 0) + mejora;
          }
        }
        // No damos bonificación por ser nuevo en el top 5 para evitar conteos incorrectos
      });
    }
    
    // Limpiar contadores de participantes que ya no están en la clasificación
    Object.keys(mejorasTotales).forEach(nombre => {
      if (!clasificacionActual.some(p => p.nombre === nombre)) {
        delete mejorasTotales[nombre];
      }
    });
    
    // Guardar las mejoras totales
    localStorage.setItem('mejorasTotales', JSON.stringify(mejorasTotales));
    
    // Verificar cambios en el primer puesto para el logro "Comeback del año"
    if (clasificacionAnterior.length > 0) {
        const primerPuestoAnterior = clasificacionAnterior[0]?.nombre;
        const primerPuestoActual = clasificacionActual[0]?.nombre;
        
        // Si hay un cambio en el primer puesto
        if (primerPuestoAnterior && primerPuestoActual && primerPuestoAnterior !== primerPuestoActual) {
            // Obtener el historial de cambios de primer puesto
            let historialPrimerPuesto = JSON.parse(localStorage.getItem('historialPrimerPuesto') || '{}');
            
            // Si el participante ya ha sido primer puesto antes
            if (historialPrimerPuesto[primerPuestoActual]) {
                // Incrementar el contador de regresos
                historialPrimerPuesto[primerPuestoActual].vecesRecuperado = 
                    (historialPrimerPuesto[primerPuestoActual].vecesRecuperado || 0) + 1;
                historialPrimerPuesto[primerPuestoActual].ultimaRecuperacion = new Date().toISOString();
            } else {
                // Primera vez que es primer puesto
                historialPrimerPuesto[primerPuestoActual] = {
                    primeraVez: new Date().toISOString(),
                    vecesRecuperado: 0, // Aún no ha recuperado, solo es su primera vez
                    ultimaRecuperacion: null
                };
            }
            
            // Guardar el historial de cambios de primer puesto
            localStorage.setItem('historialPrimerPuesto', JSON.stringify(historialPrimerPuesto));
        }
    }
    
    // Agregar al historial solo si hay cambios respecto a la última entrada
    const ultimaClasificacion = historial.length > 0 ? 
      JSON.stringify(historial[historial.length - 1].clasificacion) : null;
    const clasificacionActualStr = JSON.stringify(clasificacionActual);
    
    if (ultimaClasificacion !== clasificacionActualStr) {
      historial.push({
        fecha: fechaActual,
        clasificacion: clasificacionActual
      });
      
      // Mantener solo los últimos 30 días de historial
      const historialReciente = historial.slice(-30);
      localStorage.setItem('historialClasificacion', JSON.stringify(historialReciente));
    }
  } catch (error) {
    console.error('Error al guardar historial de clasificación:', error);
  }
}

function renderTable() {
  // Guardar posiciones antiguas de los participantes por nombre para detectar subidas/bajadas
  if (!window.__lastOrder) window.__lastOrder = [];
  const prevOrder = window.__lastOrder.slice();

  const tbody = document.querySelector('#rankingTable tbody');
  // 1. Guardar posiciones actuales de las filas (por nombre)
  const oldPositions = {};
  Array.from(tbody.children).forEach(tr => {
    const name = tr.children[1]?.textContent;
    if (name) oldPositions[name] = tr.getBoundingClientRect().top;
  });

  // Renderizar nueva tabla
  tbody.innerHTML = '';
  const sorted = sortParticipants(participants);
  const trs = [];
  sorted.forEach((p, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="pos-cell">${
        idx === 0 ? '<span class="medal-table">🥇</span>' :
        idx === 1 ? '<span class="medal-table">🥈</span>' :
        idx === 2 ? '<span class="medal-table">🥉</span>' :
        (idx + 1) + 'º'
      }</td>
      <td>${p.name}</td>
      <td>
        <div class="medal-controls">
          <button class="medal-btn add-btn" onclick="event.stopPropagation(); addMedal(${participants.findIndex(part => part.name === p.name)}, 'gold')">+</button>
          <span class="medal-count">${p.gold}</span>
          <button class="medal-btn remove-btn" onclick="event.stopPropagation(); removeMedal(${participants.findIndex(part => part.name === p.name)}, 'gold')">-</button>
        </div>
      </td>
      <td>
        <div class="medal-controls">
          <button class="medal-btn add-btn" onclick="event.stopPropagation(); addMedal(${participants.findIndex(part => part.name === p.name)}, 'silver')">+</button>
          <span class="medal-count">${p.silver}</span>
          <button class="medal-btn remove-btn" onclick="event.stopPropagation(); removeMedal(${participants.findIndex(part => part.name === p.name)}, 'silver')">-</button>
        </div>
      </td>
      <td>
        <div class="medal-controls">
          <button class="medal-btn add-btn" onclick="event.stopPropagation(); addMedal(${participants.findIndex(part => part.name === p.name)}, 'bronze')">+</button>
          <span class="medal-count">${p.bronze}</span>
          <button class="medal-btn remove-btn" onclick="event.stopPropagation(); removeMedal(${participants.findIndex(part => part.name === p.name)}, 'bronze')">-</button>
        </div>
      </td>
      <td><button class="icon-btn edit-btn" title="Editar"><span aria-hidden="true">✏️</span></button></td>
      <td><button class="icon-btn delete-btn" title="Eliminar"><span aria-hidden="true">🗑️</span></button></td>
    `;

    tr.querySelector('.edit-btn').onclick = () => openEditModal(sorted, idx);
    tr.querySelector('.delete-btn').onclick = (event) => {
      const origIdx = participants.findIndex(x =>
        x.name === p.name && x.gold === p.gold && x.silver === p.silver && x.bronze === p.bronze
      );
      if (origIdx !== -1) {
        if (confirm(`¿Eliminar a "${p.name}"?`)) {
          const row = event.target.closest('tr');
          row.classList.add('row-pop-shrink');
          row.addEventListener('animationend', function handler() {
            row.removeEventListener('animationend', handler);
            participants.splice(origIdx, 1);
            saveParticipants();
            renderTable();
            renderPodium();
          });
        }
      }
    };

    // Detectar cambio de posición
    const prevIdx = prevOrder.indexOf(p.name);
    const posCell = tr.querySelector('.pos-cell .medal-table');
    if (prevIdx !== -1 && prevIdx !== idx) {
      if (prevIdx > idx) {
        tr.classList.add('row-up');
        setTimeout(() => tr.classList.remove('row-up'), 1200);
        if (posCell) {
          posCell.classList.remove('medal-animate');
          void posCell.offsetWidth;
          posCell.classList.add('medal-animate');
          setTimeout(() => posCell.classList.remove('medal-animate'), 900);
        }
      } else if (prevIdx < idx) {
        tr.classList.add('row-down');
        setTimeout(() => tr.classList.remove('row-down'), 1200);
        if (posCell) {
          posCell.classList.remove('medal-animate');
          void posCell.offsetWidth;
          posCell.classList.add('medal-animate');
          setTimeout(() => posCell.classList.remove('medal-animate'), 900);
        }
      }
    }
    // Animar medallas de la tabla para top 3 siempre
    if (idx <= 2) {
      const posCell = tr.querySelector('.pos-cell .medal-table');
      if (posCell) {
        posCell.classList.remove('medal-animate');
        void posCell.offsetWidth;
        posCell.classList.add('medal-animate');
        setTimeout(() => posCell.classList.remove('medal-animate'), 900);
      }
    }
    trs.push(tr);
    tbody.appendChild(tr);
  });

  // 3. Animar movimiento FLIP
  trs.forEach(tr => {
    const name = tr.children[1]?.textContent;
    if (!name) return;
    const oldTop = oldPositions[name];
    const newTop = tr.getBoundingClientRect().top;
    // --- Animación especial si es el recién añadido ---
    if (window.__newlyAddedName === name && oldTop === undefined) {
      // Si no existía antes, animar desde abajo
      const lastRow = trs[trs.length - 1];
      if (lastRow && lastRow !== tr) {
        const from = lastRow.getBoundingClientRect().top;
        const delta = from - newTop;
        tr.style.transition = 'none';
        tr.style.transform = `translateY(${delta}px)`;
        requestAnimationFrame(() => {
          tr.style.transition = 'transform 0.6s cubic-bezier(.4,2,.6,1)';
          tr.style.transform = '';
        });
      }
    } else if (oldTop !== undefined) {
      // Animación FLIP normal
      const delta = oldTop - newTop;
      if (delta !== 0) {
        tr.style.transition = 'none';
        tr.style.transform = `translateY(${delta}px)`;
        requestAnimationFrame(() => {
          tr.style.transition = 'transform 0.5s cubic-bezier(.4,2,.6,1)';
          tr.style.transform = '';
        });
      }
    }
  });
  renderPodium();
  // Guardar el nuevo orden para la próxima comparación
  window.__lastOrder = sorted.map(p => p.name);
  // Limpiar el flag del participante añadido
  window.__newlyAddedName = undefined;
}

// ========== PODIO ==========
function renderPodium() {
  const sorted = sortParticipants(participants);
  // Guardar el podio anterior
  if (!window.__lastPodium) window.__lastPodium = [null, null, null];
  const prev = window.__lastPodium;
  const curr = [sorted[0]?.name || null, sorted[1]?.name || null, sorted[2]?.name || null];

  // 1. Confetti si hay nuevo primero
  if (curr[0] && curr[0] !== prev[0]) {
    launchConfetti();
  }
  
  // 2. Shake si alguien sale del podio
  [0, 1, 2].forEach(i => {
    if (prev[i] && !curr.includes(prev[i])) {
      // Buscar el rectángulo del podio anterior y aplicar shake
      const spots = ['first-place', 'second-place', 'third-place'];
      for (const spot of spots) {
        const el = document.getElementById(spot).parentElement;
        if (el && el.textContent.includes(prev[i])) {
          el.classList.remove('shake-podium');
          void el.offsetWidth;
          el.classList.add('shake-podium');
        }
      }
    }
  });


  // 4. Animación de nombres (slide)
  function animateSlide(id, newName, fallback) {
    const el = document.getElementById(id).querySelector('.podium-name');
    const medal = document.getElementById(id).parentElement.querySelector('p');
    const current = el.textContent;
    if (current === (newName || fallback)) return;
    // Animar medalla
    if (medal) {
      medal.classList.remove('medal-animate');
      void medal.offsetWidth;
      medal.classList.add('medal-animate');
      setTimeout(() => medal.classList.remove('medal-animate'), 900);
    }
    // Animar salida del nombre
    el.classList.remove('slide-in-left');
    el.classList.add('slide-out-right');
    // Cuando termina la animación de salida, cambia el texto y anima la entrada
    el.addEventListener('animationend', function handler() {
      el.removeEventListener('animationend', handler);
      el.classList.remove('slide-out-right');
      el.textContent = newName || fallback;
      el.classList.add('slide-in-left');
      // Quitar la clase de entrada tras la animación
      el.addEventListener('animationend', function handler2() {
        el.removeEventListener('animationend', handler2);
        el.classList.remove('slide-in-left');
      });
    });
  }
  animateSlide('first-place', sorted[0]?.name, 'Primero');
  animateSlide('second-place', sorted[1]?.name, 'Segundo');
  animateSlide('third-place', sorted[2]?.name, 'Tercero');

  // Actualizar el podio anterior
  window.__lastPodium = curr;
}

// Confeti animado (canvas simple)
function launchConfetti() {
  if (document.getElementById('confetti-canvas')) return; // Evitar duplicados
  const canvas = document.createElement('canvas');
  canvas.id = 'confetti-canvas';
  canvas.style.position = 'fixed';
  canvas.style.left = 0;
  canvas.style.top = 0;
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = 9999;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const W = window.innerWidth, H = window.innerHeight;
  canvas.width = W; canvas.height = H;
  // Confeti particles
  const colors = ['#ffcc80','#ffeb99','#ff7eb3','#ff758c','#29b6f6','#ffab40','#fff'];
  const confetti = Array.from({length: 80}, () => ({
    x: Math.random()*W,
    y: Math.random()*-H*0.3,
    r: 7+Math.random()*7,
    d: 3+Math.random()*3,
    color: colors[Math.floor(Math.random()*colors.length)],
    tilt: Math.random()*10-5,
    tiltAngle: 0
  }));
  let angle = 0;
  function draw() {
    ctx.clearRect(0,0,W,H);
    angle += 0.01;
    for (const p of confetti) {
      p.y += Math.cos(angle+p.d)+2+p.d/2;
      p.x += Math.sin(angle)*2;
      p.tiltAngle += 0.1;
      p.tilt = Math.sin(p.tiltAngle)*8;
      ctx.beginPath();
      ctx.lineWidth = p.r;
      ctx.strokeStyle = p.color;
      ctx.moveTo(p.x+p.tilt+2, p.y);
      ctx.lineTo(p.x, p.y+p.tilt+8);
      ctx.stroke();
    }
  }
  function animate() {
    draw();
    // Solo borra el canvas cuando todas las partículas salieron de abajo
    if (confetti.some(p => p.y < H + 20)) {
      requestAnimationFrame(animate);
    } else {
      canvas.remove();
    }
  }
  animate();
}


// ========== AGREGAR PARTICIPANTE ==========
document.getElementById('addForm').onsubmit = function(e) {
  e.preventDefault();
  const name = document.getElementById('nameInput').value.trim();
  const gold = parseInt(document.getElementById('goldInput').value, 10);
  const silver = parseInt(document.getElementById('silverInput').value, 10);
  const bronze = parseInt(document.getElementById('bronzeInput').value, 10);

  if (!name) return;
  participants.push({ name, gold, silver, bronze });
  saveParticipants();

  // --- Animación especial para el nuevo participante ---
  // Guardar el nombre recién añadido en window para usarlo en renderTable
  window.__newlyAddedName = name;
  renderTable();
  this.reset();
};

// ========== MODAL EDICIÓN ==========
function openEditModal(sorted, idx) {
  // Añadir pelota de playa decorativa si no existe
  setTimeout(() => {
    const modal = document.querySelector('.modal-content');
    if (modal && !modal.querySelector('.palmtree')) {
      const palmtree = document.createElement('img');
      palmtree.src = 'palmera.png';
      palmtree.alt = 'Palmera';
      palmtree.className = 'palmtree';
      modal.appendChild(palmtree);
    }
    if (modal && !modal.querySelector('.modal-ball')) {
      const ball = document.createElement('img');
      ball.src = 'pelota.png';
      ball.alt = 'Pelota de playa';
      ball.className = 'modal-ball';
      modal.appendChild(ball);
    }
    // Pelota abajo a la derecha
    if (modal && !modal.querySelector('.modal-ball')) {
      const ball = document.createElement('img');
      ball.src = 'pelota.png';
      ball.alt = 'Pelota de playa';
      ball.className = 'modal-ball';
      modal.appendChild(ball);
    }
  }, 10);

  const modal = document.getElementById('editModal');
  modal.style.display = "flex";
  const p = sorted[idx];
  editIndex = participants.findIndex(x =>
    x.name === p.name && x.gold === p.gold && x.silver === p.silver && x.bronze === p.bronze
  );
  document.getElementById('editName').value = p.name;
  document.getElementById('editGold').value = p.gold;
  document.getElementById('editSilver').value = p.silver;
  document.getElementById('editBronze').value = p.bronze;
}

document.getElementById('closeModal').onclick = function() {
  document.getElementById('editModal').style.display = "none";
};

window.onclick = function(event) {
  const modal = document.getElementById('editModal');
  if (event.target === modal) {
    modal.style.display = "none";
  }
};

document.getElementById('editForm').onsubmit = function(e) {
  e.preventDefault();
  if (editIndex !== null) {
    const oldData = participants[editIndex];
    const newData = {
      name: document.getElementById('editName').value.trim(),
      gold: parseInt(document.getElementById('editGold').value, 10) || 0,
      silver: parseInt(document.getElementById('editSilver').value, 10) || 0,
      bronze: parseInt(document.getElementById('editBronze').value, 10) || 0
    };
    
    // Calcular diferencia de medallas
    const diffGold = newData.gold - (oldData.gold || 0);
    const diffSilver = newData.silver - (oldData.silver || 0);
    const diffBronze = newData.bronze - (oldData.bronze || 0);
    
    // Actualizar datos del participante
    participants[editIndex] = newData;
    saveParticipants();
    
    // Registrar cada medalla añadida individualmente
    const now = new Date();
    const medalDates = JSON.parse(localStorage.getItem('medalDates') || '[]');
    
    // Registrar oros añadidos
    for (let i = 0; i < diffGold; i++) {
      medalDates.push({
        date: now.toISOString().split('T')[0],
        timestamp: now.getTime() + i, // Añadir 1ms de diferencia para mantener orden
        type: 'gold',
        participant: newData.name
      });
    }
    
    // Registrar platas añadidas
    for (let i = 0; i < diffSilver; i++) {
      medalDates.push({
        date: now.toISOString().split('T')[0],
        timestamp: now.getTime() + 1000 + i, // Añadir 1s de diferencia para mantener orden
        type: 'silver',
        participant: newData.name
      });
    }
    
    // Registrar bronces añadidos
    for (let i = 0; i < diffBronze; i++) {
      medalDates.push({
        date: now.toISOString().split('T')[0],
        timestamp: now.getTime() + 2000 + i, // Añadir 2s de diferencia para mantener orden
        type: 'bronze',
        participant: newData.name
      });
    }
    
    // Ordenar por timestamp para asegurar el orden cronológico correcto
    medalDates.sort((a, b) => a.timestamp - b.timestamp);
    localStorage.setItem('medalDates', JSON.stringify(medalDates));
    
    // Verificar si se ha conseguido el logro "Rompecabezas"
    // Solo verificar si se añadieron nuevas medallas
    if (diffGold > 0 || diffSilver > 0 || diffBronze > 0) {
      // Obtener todas las medallas del participante
      const participantMedals = medalDates.filter(m => m.participant === newData.name);
      checkPuzzleAchievement(participantMedals, newData.name);
    }
    
    // Cerrar el modal y actualizar la tabla
    document.getElementById('editModal').style.display = "none";
    renderTable();
    renderPodium();
  }
};

// ========== EXPORTAR/IMPORTAR ==========
const exportImportModal = document.getElementById('exportImportModal');
const closeExportImportModal = document.getElementById('closeExportImportModal');
const exportJsonBtn = document.getElementById('exportCsvBtn'); // El ID se mantiene por compatibilidad
const importFileInput = document.getElementById('importFileInput');
const selectFileBtn = document.getElementById('selectFileBtn');
const selectedFileName = document.getElementById('selectedFileName');
const confirmImportBtn = document.getElementById('confirmImportBtn');

// Abrir modal de exportar/importar
document.getElementById('exportImportButton').onclick = function() {
  exportImportModal.style.display = 'block';
  document.body.style.overflow = 'hidden'; // Evitar scroll del fondo
};

// Cerrar modal al hacer clic en la X
closeExportImportModal.onclick = function() {
  exportImportModal.style.display = 'none';
  document.body.style.overflow = 'auto';
  resetImportForm();
};

// Cerrar modal al hacer clic fuera del contenido
window.onclick = function(event) {
  if (event.target === exportImportModal) {
    exportImportModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    resetImportForm();
  }
};

// Función para reiniciar el formulario de importación
function resetImportForm() {
  importFileInput.value = '';
  selectedFileName.textContent = '';
  confirmImportBtn.style.display = 'none';
}

// Exportar todos los datos
exportJsonBtn.onclick = function() {
  try {
    // Recopilar todos los datos de localStorage
    const allData = {};
    const keys = Object.keys(localStorage);
    
    // Filtrar solo las claves relevantes de la aplicación
    const relevantKeys = keys.filter(key => 
      key === 'olimpMartinez2025' || 
      key === 'medalDates' ||
      key === 'historialClasificacion' ||
      key === 'mejorasTotales' ||
      key === 'cambioDeSuerte' ||
      key === 'caidasLibres' ||
      key === 'unlockedAchievements' ||
      key === 'ganadoresNumeroSuerte' ||
      key === 'ganadoresElDiablo' ||
      key.startsWith('logro_')
    );
    
    // Obtener los datos de cada clave
    relevantKeys.forEach(key => {
      try {
        allData[key] = JSON.parse(localStorage.getItem(key));
      } catch (e) {
        // Si no se puede parsear como JSON, guardar como string
        allData[key] = localStorage.getItem(key);
      }
    });
    
    // Convertir a JSON con formato legible
    const jsonData = JSON.stringify(allData, null, 2);
    
    // Crear y descargar el archivo
    const blob = new Blob(["\uFEFF" + jsonData], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `datos_olimpicos_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Cerrar el modal después de exportar
    exportImportModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    alert('¡Datos exportados correctamente!');
  } catch (error) {
    console.error('Error al exportar datos:', error);
    alert('Error al exportar los datos. Por favor, inténtalo de nuevo.');
  }
};

// Manejar la selección de archivo
selectFileBtn.onclick = function() {
  importFileInput.click();
};

// Mostrar el nombre del archivo seleccionado
importFileInput.onchange = function() {
  if (this.files && this.files[0]) {
    const fileName = this.files[0].name;
    selectedFileName.textContent = fileName;
    // Verificar si la extensión es .json
    if (!fileName.toLowerCase().endsWith('.json')) {
      selectedFileName.textContent += ' (Se requiere archivo .json)';
      confirmImportBtn.style.display = 'none';
    } else {
      confirmImportBtn.style.display = 'inline-block';
    }
  } else {
    selectedFileName.textContent = 'Ningún archivo seleccionado';
    confirmImportBtn.style.display = 'none';
  }
};

// Confirmar importación
confirmImportBtn.onclick = function() {
  const file = importFileInput.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const fileContent = e.target.result;
      let importedData;
      
      try {
        // Intentar parsear como JSON
        importedData = JSON.parse(fileContent);
      } catch (e) {
        // Si no es JSON, intentar como CSV (compatibilidad hacia atrás)
        const lines = fileContent.split('\n').slice(1);
        const newParticipants = [];
        
        for (const line of lines) {
          if (!line.trim()) continue;
          
          const values = [];
          let inQuotes = false;
          let currentValue = '';
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              values.push(currentValue);
              currentValue = '';
            } else {
              currentValue += char;
            }
          }
          values.push(currentValue);
          
          const cleanValues = values.map(v => v.trim().replace(/^"|"$/g, ''));
          
          if (cleanValues.length >= 4) {
            newParticipants.push({
              name: cleanValues[0],
              gold: parseInt(cleanValues[1]) || 0,
              silver: parseInt(cleanValues[2]) || 0,
              bronze: parseInt(cleanValues[3]) || 0
            });
          }
        }
        
        if (newParticipants.length > 0) {
          showConfirm(
            `¿Deseas importar ${newParticipants.length} participantes?\n\n` +
            '⚠️ Esta acción reemplazará todos los participantes actuales.\n\n' +
            'Nota: Has subido un archivo CSV. Para importar todos los datos (logros, historial, etc.), ' +
            'usa el archivo JSON exportado previamente.',
            function(confirmed) {
              if (confirmed) {
                participants = newParticipants;
                saveParticipants();
                renderTable();
                renderPodium();
                exportImportModal.style.display = 'none';
                document.body.style.overflow = 'auto';
                resetImportForm();
                alert(`¡Se han importado ${newParticipants.length} participantes correctamente!`);
              }
            }
          );
        } else {
          alert('No se encontraron datos válidos en el archivo. Asegúrate de que el formato sea correcto.');
        }
        return;
      }
      
      // Si llegamos aquí, es un JSON con todos los datos
      showConfirm(
        '¿Deseas importar TODOS los datos?\n\n' +
        '⚠️ Esta acción reemplazará TODOS los datos actuales, incluyendo:\n' +
        '- Participantes actuales\n' +
        '- Historial de medallas\n' +
        '- Logros desbloqueados\n' +
        '- Estadísticas y contadores\n\n' +
        'Esta acción no se puede deshacer.',
        function(confirmed) {
          if (confirmed) {
            try {
              // Limpiar datos existentes
              Object.keys(localStorage).forEach(key => {
                if (key !== 'debug' && !key.startsWith('_')) {
                  localStorage.removeItem(key);
                }
              });
              
              // Importar los nuevos datos
              Object.keys(importedData).forEach(key => {
                if (typeof importedData[key] === 'object') {
                  localStorage.setItem(key, JSON.stringify(importedData[key]));
                } else {
                  localStorage.setItem(key, importedData[key]);
                }
              });
              
              // Recargar la aplicación
              window.location.reload();
              
            } catch (error) {
              console.error('Error al importar datos:', error);
              alert('Error al importar los datos. Por favor, verifica que el archivo sea válido.');
            }
          }
        }
      );
      
    } catch (error) {
      console.error('Error al procesar el archivo:', error);
      alert('Error al procesar el archivo. Asegúrate de que el formato sea correcto.');
    }
  };
  
  reader.onerror = function() {
    alert('Error al leer el archivo. Por favor, inténtalo de nuevo.');
  };
  
  reader.readAsText(file, 'UTF-8');
};

// ========== VENTANA DE CONFIRMACIÓN ==========
function showConfirm(message, callback) {
  // Crear elementos del modal
  const modal = document.createElement('div');
  modal.className = 'modal';
  
  const content = document.createElement('div');
  content.className = 'modal-content';
  content.style.maxWidth = '400px';
  content.style.padding = '20px';
  content.style.textAlign = 'center';
  
  // Añadir mensaje
  const messageEl = document.createElement('p');
  messageEl.textContent = message;
  messageEl.style.marginBottom = '20px';
  
  // Crear botones
  const btnContainer = document.createElement('div');
  btnContainer.style.display = 'flex';
  btnContainer.style.justifyContent = 'center';
  btnContainer.style.gap = '10px';
  
  const btnOk = document.createElement('button');
  btnOk.textContent = 'Aceptar';
  btnOk.className = 'btn';
  btnOk.style.backgroundColor = '#2196F3';
  btnOk.style.color = 'white';
  
  const btnCancel = document.createElement('button');
  btnCancel.textContent = 'Cancelar';
  btnCancel.className = 'btn';
  btnCancel.style.backgroundColor = '#607D8B';
  btnCancel.style.color = 'white';
  
  // Añadir manejadores de eventos
  btnOk.onclick = function() {
    document.body.removeChild(modal);
    callback(true);
  };
  
  btnCancel.onclick = function() {
    document.body.removeChild(modal);
    callback(false);
  };
  
  // Construir el modal
  btnContainer.appendChild(btnCancel);
  btnContainer.appendChild(btnOk);
  content.appendChild(messageEl);
  content.appendChild(btnContainer);
  modal.appendChild(content);
  
  // Añadir estilos al modal
  Object.assign(modal.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: '1000'
  });
  
  Object.assign(content.style, {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
  });
  
  // Añadir el modal al documento
  document.body.appendChild(modal);
}

// ========== REINICIAR TABLA ==========
document.getElementById('resetButton').onclick = function () {
  showConfirm("¿Seguro que deseas reiniciar la tabla?", function(confirmed) {
    if (confirmed) {
      participants = defaultParticipants.slice();
      saveParticipants();
      renderTable();
      renderPodium();
      launchFireworks();
    }
  });
};

// ========== AGREGAR MEDALLA ==========
function addMedal(index, type) {
  if (index >= 0 && index < participants.length) {
    console.log(`Añadiendo medalla de ${type} a ${participants[index].name}`);
    
    // 1. Incrementar el contador de medallas
    participants[index][type]++;
    
    // 2. Guardar los cambios en los participantes
    saveParticipants();
    
    // 3. Registrar la fecha de la medalla (esto también guarda en localStorage)
    trackMedalDate(type, participants[index].name);
    
    // 4. Forzar una actualización completa de la interfaz
    if (typeof renderTable === 'function') renderTable();
    if (typeof renderPodium === 'function') renderPodium();
    
    // 5. Forzar actualización de logros si estamos en la página de estadísticas
    if (typeof cargarLogrosDestacados === 'function') {
      cargarLogrosDestacados();
    }
  } else {
    console.error('Índice de participante inválido:', index);
  }
}

// ========== QUITAR MEDALLA ==========
function removeMedal(index, type) {
  if (index >= 0 && index < participants.length) {
    if (participants[index][type] > 0) {
      console.log(`Quitando medalla de ${type} a ${participants[index].name}`);
      
      // 1. Decrementar el contador de medallas
      participants[index][type]--;
      
      // 2. Guardar los cambios en los participantes
      saveParticipants();
      
      // 3. Forzar una actualización completa de la interfaz
      if (typeof renderTable === 'function') renderTable();
      if (typeof renderPodium === 'function') renderPodium();
      
      // 4. Forzar actualización de logros si estamos en la página de estadísticas
      if (typeof cargarLogrosDestacados === 'function') {
        cargarLogrosDestacados();
      }
    }
  } else {
    console.error('Índice de participante inválido:', index);
  }
}

// ====== FIREWORKS ANIMATION ======
function launchFireworks() {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.left = 0;
  canvas.style.top = 0;
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = 3000;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const colors = ['#ff3', '#f36', '#3cf', '#6f3', '#fc3', '#f39', '#39f', '#fff', '#f60'];
  let fireworks = [];
  // Generar una tanda de fuegos artificiales
  function createFireworks() {
    const arr = [];
    for (let i = 0; i < 7 + Math.random() * 4; i++) {
      const x = Math.random() * (canvas.width * 0.8) + canvas.width * 0.1;
      const y = Math.random() * (canvas.height * 0.2) + canvas.height * 0.07;
      const fw = { x, y, particles: [] };
      for (let j = 0; j < 26 + Math.random() * 10; j++) {
        const angle = (Math.PI * 2 * j) / (26 + Math.random() * 10);
        const speed = 2.2 + Math.random() * 3.2;
        fw.particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          color: colors[Math.floor(Math.random() * colors.length)],
          radius: 2.1 + Math.random() * 1.7
        });
      }
      arr.push(fw);
    }
    return arr;
  }
  // Primera tanda
  fireworks = createFireworks();
  let frame = 0;
  let secondWaveLaunched = false;
  const totalFrames = 130; // ~2.2 segundos a 60fps
  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    fireworks.forEach(fw => {
      fw.particles.forEach(p => {
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });
      fw.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.97;
        p.vy *= 0.97;
        p.vy += 0.02;
        p.alpha *= 0.97 - Math.random()*0.01;
      });
    });
    // Segunda tanda a mitad de la animación
    if (!secondWaveLaunched && frame === Math.floor(totalFrames/2)) {
      fireworks = fireworks.concat(createFireworks());
      secondWaveLaunched = true;
    }
    frame++;
    if (frame < totalFrames) {
      requestAnimationFrame(draw);
    } else {
      canvas.remove();
    }
    ctx.globalAlpha = 1;
  }
  draw();
}


// ========== ANUNCIAR GANADOR ==========
document.getElementById('announceWinnerBtn')?.addEventListener('click', function() {
  // Intenta obtener el nombre del podio directamente del DOM
  let winnerName = '';
  const podiumFirst = document.querySelector('.podium .podium-name.podium-1');
  if (podiumFirst && podiumFirst.textContent.trim()) {
    winnerName = podiumFirst.textContent.trim();
  } else {
    const sorted = sortParticipants(participants);
    if (sorted.length > 0) {
      winnerName = sorted[0].name;
    }
  }
  if (winnerName) {
    sessionStorage.setItem('winnerName', winnerName);
  } else {
    sessionStorage.removeItem('winnerName');
  }
  const main = document.querySelector('main');
  const btn = this;
  if (!main || btn.disabled) return;
  btn.disabled = true;
  // Desplazamiento suave al inicio
  window.scrollTo({top: 0, behavior: 'smooth'});
  
  // Esperar a que termine el scroll (1s) + 1 segundo adicional
  setTimeout(() => {
    // Aplicar animación de salida
    main.classList.add('slide-out-right-page');
    
    // Animar imagen superior (logo) y título principal
    const logoImg = document.querySelector('#logo') || document.querySelector('header img');
    if (logoImg) logoImg.classList.add('slide-out-right-page');
    
    const mainTitle = document.querySelector('header h1') || 
                     document.querySelector('.main-title') || 
                     document.querySelector('.header-title');
    if (mainTitle) mainTitle.classList.add('slide-out-right-page');
    
    // Cambiar de página después de la animación
    setTimeout(() => {
      window.location.href = 'ganador.html';
    }, 600); // Tiempo de la animación
  }, 1000); // 1 segundo de espera después del scroll
});

// ====// ====== ANIMACIÓN DE ELIMINACIÓN ======
// ===== ANIMACIÓN DE DESINTEGRACIÓN POLVO =====
function dustDisintegrateRow(row) {
  if (!row) return;
  row.classList.add('row-deleting');
  const rowRect = row.getBoundingClientRect();
  // Para cada celda, crear partículas
  Array.from(row.children).forEach(td => {
    const tdRect = td.getBoundingClientRect();
    // Tomar color del texto o fondo
    const color = window.getComputedStyle(td).color || '#bbb';
    // Generar partículas
    for (let i = 0; i < 18; i++) {
      const particle = document.createElement('div');
      particle.className = 'dust-particle';
      // Posición relativa a la celda
      const relX = Math.random() * tdRect.width;
      const relY = Math.random() * tdRect.height;
      particle.style.left = (tdRect.left - rowRect.left + relX) + 'px';
      particle.style.top = (tdRect.top - rowRect.top + relY) + 'px';
      particle.style.setProperty('--dust-color', color);
      // Trayectoria aleatoria
      const angle = (Math.random() - 0.5) * Math.PI;
      const dist = 30 + Math.random()*50;
      const dx = Math.cos(angle) * dist;
      const dy = 40 + Math.random()*60;
      particle.style.setProperty('--dust-x', `${dx}px`);
      particle.style.setProperty('--dust-y', `${dy}px`);
      particle.style.setProperty('--dust-scale', 1.1 + Math.random()*0.8);
      row.appendChild(particle);
      setTimeout(() => particle.remove(), 850);
    }
    td.style.opacity = '0.2';
  });
}

// La funcionalidad de guardar ha sido eliminada



// ========== INICIALIZACIÓN ==========
function init() {
  // Cargar participantes desde localStorage
  participants = loadParticipants();
  renderTable();
}
document.addEventListener('DOMContentLoaded', init);
