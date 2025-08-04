// ==================== PARTICIPANTES INICIALES ====================
const defaultParticipants = [
  { name: 'Lucía Torres', gold: 2, silver: 3, bronze: 1 },
  { name: 'Mario Gómez', gold: 3, silver: 1, bronze: 2 },
  { name: 'Sofía Pérez', gold: 2, silver: 2, bronze: 2 },
  { name: 'Carlos Martínez', gold: 1, silver: 2, bronze: 3 }
];

let participants = [];
let editIndex = null;

// ========== LOCAL STORAGE UTILITIES ==========
function loadParticipants() {
  const data = localStorage.getItem('olimpMartinez2025');
  return data ? JSON.parse(data) : defaultParticipants.slice();
}
function saveParticipants() {
  localStorage.setItem('olimpMartinez2025', JSON.stringify(participants));
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
function renderTable() {
  const tbody = document.querySelector('#rankingTable tbody');
  tbody.innerHTML = '';
  const sorted = sortParticipants(participants);
  sorted.forEach((p, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${idx + 1}º</td>
      <td>${p.name}</td>
      <td>${p.gold}</td>
      <td>${p.silver}</td>
      <td>${p.bronze}</td>
      <td><button class="icon-btn edit-btn" title="Editar"><span aria-hidden="true">✏️</span></button></td>
      <td><button class="icon-btn delete-btn" title="Eliminar"><span aria-hidden="true">🗑️</span></button></td>
    `;
    tr.querySelector('.edit-btn').onclick = () => openEditModal(sorted, idx);
    tr.querySelector('.delete-btn').onclick = () => {
      const origIdx = participants.findIndex(x =>
        x.name === p.name && x.gold === p.gold && x.silver === p.silver && x.bronze === p.bronze
      );
      if (origIdx !== -1) {
        if (confirm(`¿Eliminar a "${p.name}"?`)) {
          participants.splice(origIdx, 1);
          saveParticipants();
          renderTable();
          renderPodium();
        }
      }
    };
    tbody.appendChild(tr);
  });
  renderPodium();
}

// ========== PODIO ==========
function renderPodium() {
  const sorted = sortParticipants(participants);
  document.getElementById('first-place').textContent = sorted[0]?.name || 'Primero';
  document.getElementById('second-place').textContent = sorted[1]?.name || 'Segundo';
  document.getElementById('third-place').textContent = sorted[2]?.name || 'Tercero';
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
  renderTable();
  this.reset();
};

// ========== MODAL EDICIÓN ==========
function openEditModal(sorted, idx) {
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
    participants[editIndex] = {
      name: document.getElementById('editName').value.trim(),
      gold: parseInt(document.getElementById('editGold').value, 10),
      silver: parseInt(document.getElementById('editSilver').value, 10),
      bronze: parseInt(document.getElementById('editBronze').value, 10)
    };
    saveParticipants();
    renderTable();
    document.getElementById('editModal').style.display = "none";
  }
};

// ========== EXPORTAR A CSV ==========
document.getElementById('exportButton').onclick = function () {
  const rows = [["Nombre", "Oro", "Plata", "Bronce"]];
  participants.forEach(p => rows.push([p.name, p.gold, p.silver, p.bronze]));
  const csv = rows.map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "participantes.csv";
  a.click();
  URL.revokeObjectURL(url);
};

// ========== REINICIAR TABLA ==========
document.getElementById('resetButton').onclick = function () {
  if (confirm("¿Seguro que deseas reiniciar la tabla?")) {
    participants = defaultParticipants.slice();
    saveParticipants();
    renderTable();
  }
};

// ========== INICIALIZACIÓN ==========
function init() {
  participants = loadParticipants();
  renderTable();
}
document.addEventListener('DOMContentLoaded', init);
