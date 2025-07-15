// Este archivo es el punto de entrada principal de la aplicación
// La configuración de la navegación ahora está en app/_layout.tsx
import "expo-router/entry";
import { useState } from "react";
import {
  FixtureTorneo,
  generarFixturesParaTorneos,
  Torneo,
} from "./generarFixture";

const torneosIniciales: Torneo[] = [
  // ...aquí tus torneos iniciales...
];

export default function App() {
  const [torneos] = useState<Torneo[]>(torneosIniciales);
  const [fixtures, setFixtures] = useState<FixtureTorneo[] | null>(null);

  const handleGenerarFixture = () => {
    setFixtures(generarFixturesParaTorneos(torneos));
  };

  return (
    <div>
      <button onClick={handleGenerarFixture}>Generar Fixture</button>
      {fixtures &&
        fixtures.map((fixture) => (
          <div key={fixture.torneoId}>
            <h2>{fixture.torneoNombre}</h2>
            <ul>
              {fixture.partidos.map((partido, idx) => (
                <li key={idx}>
                  Jornada {partido.jornada}: {partido.local.nombre} vs{" "}
                  {partido.visitante.nombre}
                </li>
              ))}
            </ul>
          </div>
        ))}
    </div>
  );
}
