// Puedes reemplazar estos tipos por los de tu modelo real si los tienes en otro archivo
export interface Equipo {
  id: number;
  nombre: string;
}

export interface Partido {
  jornada: number;
  local: Equipo;
  visitante: Equipo;
}

export interface Torneo {
  id: number;
  nombre: string;
  equipos: Equipo[];
}

export interface FixtureTorneo {
  torneoId: number;
  torneoNombre: string;
  partidos: Partido[];
}

// Genera el fixture para un solo torneo (round-robin)
export function generarFixture(equipos: Equipo[]): Partido[] {
  const cantidadEquipos = equipos.length;
  const esImpar = cantidadEquipos % 2 !== 0;
  const equiposFixture = [...equipos];

  if (esImpar) {
    equiposFixture.push({ id: -1, nombre: "Libre" }); // Equipo ficticio para jornadas libres
  }

  const totalJornadas = equiposFixture.length - 1;
  const partidosPorJornada = equiposFixture.length / 2;
  const fixture: Partido[] = [];

  for (let jornada = 0; jornada < totalJornadas; jornada++) {
    for (let i = 0; i < partidosPorJornada; i++) {
      const local = equiposFixture[i];
      const visitante = equiposFixture[equiposFixture.length - 1 - i];
      if (local.id !== -1 && visitante.id !== -1) {
        fixture.push({
          jornada: jornada + 1,
          local,
          visitante,
        });
      }
    }
    // Rotar equipos (excepto el primero)
    equiposFixture.splice(1, 0, equiposFixture.pop()!);
  }

  return fixture;
}

// Genera los fixtures para todos los torneos cargados
export function generarFixturesParaTorneos(torneos: Torneo[]): FixtureTorneo[] {
  return torneos.map((torneo) => ({
    torneoId: torneo.id,
    torneoNombre: torneo.nombre,
    partidos: generarFixture(torneo.equipos),
  }));
}
