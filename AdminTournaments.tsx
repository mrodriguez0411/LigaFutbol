// Este archivo maneja la administración de torneos, incluyendo la generación de fixtures
import { useState } from "react";
import {
  Equipo,
  FixtureTorneo,
  generarFixture,
  Torneo,
} from "./generarFixture";

export default function AdminTournaments() {
  const [torneos, setTorneos] = useState<Torneo[]>([
    // ...torneos iniciales...
  ]);
  const [fixtures, setFixtures] = useState<{
    [torneoId: number]: FixtureTorneo | null;
  }>({});

  // Estado para el formulario de nuevo torneo
  const [nuevoNombre, setNuevoNombre] = useState("");

  // Equipos de prueba para el ejemplo
  const equiposEjemplo: Equipo[] = [
    { id: 1, nombre: "Equipo A" },
    { id: 2, nombre: "Equipo B" },
    { id: 3, nombre: "Equipo C" },
    { id: 4, nombre: "Equipo D" },
  ];

  // Crear torneo: agrega equipos de prueba
  const handleCrearTorneo = () => {
    if (!nuevoNombre) return;
    const nuevoTorneo: Torneo = {
      id: Date.now(),
      nombre: nuevoNombre,
      equipos: equiposEjemplo,
    };
    setTorneos((prev) => [...prev, nuevoTorneo]);
    setFixtures((prev) => ({ ...prev, [nuevoTorneo.id]: null }));
    setNuevoNombre("");
  };

  // Generar fixture manualmente
  const handleGenerarFixture = (torneo: Torneo) => {
    const partidos = generarFixture(torneo.equipos);
    setFixtures((prev) => ({
      ...prev,
      [torneo.id]:
        partidos.length > 0
          ? { torneoId: torneo.id, torneoNombre: torneo.nombre, partidos }
          : null,
    }));
  };

  return (
    <div>
      {/* Formulario simple para crear torneo */}
      <h3>Crear Torneo</h3>
      <input
        type="text"
        placeholder="Nombre del torneo"
        value={nuevoNombre}
        onChange={(e) => setNuevoNombre(e.target.value)}
      />
      <button onClick={handleCrearTorneo}>Crear Torneo</button>
      {torneos.map((torneo) => (
        <div key={torneo.id}>
          <h2>{torneo.nombre}</h2>
          {!fixtures[torneo.id] && (
            <button onClick={() => handleGenerarFixture(torneo)}>
              Generar Fixture
            </button>
          )}
          {fixtures[torneo.id] && (
            <ul>
              {fixtures[torneo.id]!.partidos.map((partido, idx) => (
                <li key={idx}>
                  Jornada {partido.jornada}: {partido.local.nombre} vs{" "}
                  {partido.visitante.nombre}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
