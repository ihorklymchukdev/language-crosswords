import type { Entry, EntryStatus } from '../domain/types';

const WORDS = `
pan sal sol mar luz voz paz pez mes año día ojo pie uña oso café leche queso huevo arroz
carne pollo pescado fruta manzana naranja plátano limón fresa uva pera melón sandía piña
tomate cebolla ajo patata lechuga zanahoria pepino maíz trigo harina azúcar aceite vinagre
miel sopa tarta galleta helado bocadillo jamón chorizo salsa pimienta canela vino cerveza
agua zumo jugo botella vaso taza plato cuchara tenedor cuchillo mesa silla sofá cama
armario cocina baño salón jardín puerta ventana pared techo suelo escalera llave lámpara
espejo cortina alfombra almohada manta toalla jabón cepillo peine reloj teléfono radio
perro gato caballo vaca cerdo oveja cabra conejo ratón pájaro paloma águila búho loro
gallina pato pavo tigre león lobo zorro ciervo mono elefante jirafa cebra camello ballena
delfín tiburón pulpo cangrejo tortuga rana serpiente lagarto abeja hormiga mosca mosquito
araña mariposa caracol gusano cabeza cara nariz boca diente lengua oreja cuello hombro
brazo codo mano dedo pecho espalda cintura pierna rodilla tobillo corazón sangre hueso
piel pelo frente mejilla labio garganta estómago calle plaza parque museo iglesia escuela
hospital farmacia mercado tienda banco oficina hotel cine teatro estadio puente torre
ciudad pueblo barrio esquina semáforo coche autobús tren avión barco bicicleta moto taxi
metro billete maleta viaje playa montaña río lago bosque selva desierto isla costa cielo
nube lluvia nieve viento tormenta trueno niebla estrella luna tierra fuego piedra arena
árbol flor hoja rama raíz hierba semilla roca volcán valle colina campo granja huerto
rojo azul verde blanco negro gris rosa morado marrón dorado grande pequeño alto bajo
largo corto ancho gordo delgado joven viejo nuevo bonito feo rápido lento fuerte débil
feliz triste alegre cansado enfermo sano rico pobre caro barato fácil difícil limpio
sucio lleno vacío caliente frío dulce amargo salado suave duro blando claro oscuro
comer beber dormir hablar cantar bailar correr saltar nadar volar leer escribir pintar
cocinar limpiar lavar abrir cerrar subir bajar entrar salir llegar viajar jugar ganar
perder buscar encontrar comprar vender pagar mirar escuchar sentir pensar soñar reír
llorar vivir morir nacer crecer aprender enseñar estudiar trabajar ayudar esperar
madre padre hijo hija hermano hermana abuelo abuela tío tía primo prima sobrino nieto
esposa marido novio novia amigo vecino niño niña bebé familia médico enfermera maestro
profesor alumno abogado juez policía bombero cartero panadero carnicero pintor músico
actor actriz cantante escritor poeta piloto marinero soldado cocinero camarero granjero
camisa falda vestido abrigo chaqueta jersey bufanda guante sombrero gorra zapato bota
calcetín cinturón bolso pañuelo gafas anillo collar pulsera pendiente lunes martes
miércoles jueves viernes sábado domingo enero febrero marzo abril mayo junio julio
agosto octubre noviembre diciembre semana hora minuto segundo mañana tarde noche
invierno verano otoño primavera libro cuaderno lápiz papel carta sobre mapa foto
música canción guitarra piano tambor fiesta regalo juego pelota muñeca cometa globo
dinero moneda precio cuenta compra tarjeta trabajo empresa reunión correo mensaje
noticia periódico revista idioma palabra frase pregunta respuesta historia cuento
sueño recuerdo amor miedo alegría paciencia verdad mentira suerte salud vida muerte
mundo país nación frontera bandera himno ley gobierno guerra deporte fútbol tenis
golf carrera equipo partido gol árbitro campeón medalla premio piscina gimnasio
montón ñandú ñoño caña leña puño moño señor señora pequeña
mañanero otoñal añejo bañera cigüeña pingüino vergüenza güero
`;

export const FIXTURE_WORDS: readonly string[] = WORDS.split(/\s+/).filter((w) => w.length > 0);

export function makeEntry(word: string, id = `es-A2-${word}`, status: EntryStatus = 'auto-only'): Entry {
  return {
    id,
    language: 'es',
    word,
    pos: 'noun',
    level: 'A2',
    region: 'neutral',
    themes: [],
    clue: 'pista',
    clueEn: 'clue',
    translationEn: 'word',
    status,
  };
}

export function fixtureEntries(count: number): Entry[] {
  return FIXTURE_WORDS.slice(0, count).map((w) => makeEntry(w));
}
