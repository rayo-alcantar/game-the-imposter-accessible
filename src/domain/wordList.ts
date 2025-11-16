import { WordPair } from "./gameTypes";

export interface WordCategory {
  id: string;
  name: string;
  pairs: WordPair[];
}

// Grouped word pairs by category so el host puede elegir el tema.
export const WORD_CATEGORIES: WordCategory[] = [
  {
    id: "comida-bebida",
    name: "Comida y bebida",
    pairs: [
      { civil: "Hamburguesa", impostor: "Sandwich", theme: "Comida" },
      { civil: "Paella", impostor: "Risotto", theme: "Arroces" },
      { civil: "Taco", impostor: "Burrito", theme: "Mexicana" },
      { civil: "Sushi", impostor: "Poke", theme: "Asiatica" },
      { civil: "Ramen", impostor: "Pho", theme: "Sopas" },
      { civil: "Arepa", impostor: "Gordita", theme: "Latino" },
      { civil: "Tamal", impostor: "Hallaca", theme: "Latino" },
      { civil: "Ceviche", impostor: "Cocktail", theme: "Mariscos" },
      { civil: "Croissant", impostor: "Concha", theme: "Panaderia" },
      { civil: "Panqueque", impostor: "Crepa", theme: "Desayuno" },
      { civil: "Chocolate", impostor: "Caramelo", theme: "Dulces" },
      { civil: "Helado", impostor: "Raspado", theme: "Postres" },
      { civil: "Cafe", impostor: "Te", theme: "Bebidas" },
      { civil: "Cerveza", impostor: "Sidra", theme: "Bebidas" },
      { civil: "Vino", impostor: "Champagne", theme: "Bebidas" },
      { civil: "Queso", impostor: "Requeson", theme: "Lacteos" },
      { civil: "Palomitas", impostor: "Nachos", theme: "Snacks" },
    ],
  },
  {
    id: "sistemas-devops",
    name: "Sistemas y DevOps",
    pairs: [
      { civil: "Servidor", impostor: "Mainframe", theme: "Infra" },
      { civil: "Docker", impostor: "Maquina virtual", theme: "Infra" },
      { civil: "Balanceador", impostor: "Proxy", theme: "Networking" },
      { civil: "Cache", impostor: "CDN", theme: "Performance" },
      { civil: "Firewall", impostor: "WAF", theme: "Seguridad" },
      { civil: "Kubernetes", impostor: "Nomad", theme: "Orquestacion" },
      { civil: "RabbitMQ", impostor: "Kafka", theme: "Mensajeria" },
      { civil: "API Gateway", impostor: "Service Mesh", theme: "Arquitectura" },
      { civil: "Postgres", impostor: "MySQL", theme: "Base de datos" },
      { civil: "Redis", impostor: "Memcached", theme: "Cache" },
      { civil: "Bash", impostor: "Powershell", theme: "CLI" },
      { civil: "CI/CD", impostor: "Deploy manual", theme: "Release" },
      { civil: "Grafana", impostor: "DataDog", theme: "Observabilidad" },
      { civil: "Logs", impostor: "Traces", theme: "Monitoreo" },
      { civil: "Backup", impostor: "Replica", theme: "Resiliencia" },
    ],
  },
  {
    id: "tecnologia-apps",
    name: "Tecnologia y apps",
    pairs: [
      { civil: "Laptop", impostor: "Tablet", theme: "Dispositivos" },
      { civil: "Smartphone", impostor: "Smartwatch", theme: "Gadgets" },
      { civil: "Bluetooth", impostor: "NFC", theme: "Conectividad" },
      { civil: "Instagram", impostor: "TikTok", theme: "Social" },
      { civil: "Netflix", impostor: "YouTube", theme: "Streaming" },
      { civil: "Spotify", impostor: "Apple Music", theme: "Musica" },
      { civil: "Dropbox", impostor: "Google Drive", theme: "Nube" },
      { civil: "Gmail", impostor: "Outlook", theme: "Correo" },
      { civil: "GPS", impostor: "Brujula", theme: "Navegacion" },
      { civil: "Figma", impostor: "Canva", theme: "Diseno" },
      { civil: "Whatsapp", impostor: "Telegram", theme: "Mensajeria" },
      { civil: "Smartwatch", impostor: "Banda fitness", theme: "Wearables" },
    ],
  },
  {
    id: "deportes",
    name: "Deportes",
    pairs: [
      { civil: "Futbol", impostor: "Rugby", theme: "Equipo" },
      { civil: "Baloncesto", impostor: "Voleibol", theme: "Equipo" },
      { civil: "Tenis", impostor: "Padel", theme: "Raqueta" },
      { civil: "Surf", impostor: "Bodyboard", theme: "Agua" },
      { civil: "Natacion", impostor: "Waterpolo", theme: "Piscina" },
      { civil: "Ciclismo", impostor: "Spinning", theme: "Ruedas" },
      { civil: "Boxeo", impostor: "MMA", theme: "Combate" },
      { civil: "Atletismo", impostor: "Maraton", theme: "Pista" },
      { civil: "Escalada", impostor: "Boulder", theme: "Montana" },
      { civil: "Hockey", impostor: "Beisbol", theme: "Equipo" },
      { civil: "Esgrima", impostor: "Arco", theme: "Precision" },
    ],
  },
  {
    id: "animales",
    name: "Animales",
    pairs: [
      { civil: "Lobo", impostor: "Perro", theme: "Caninos" },
      { civil: "Gato", impostor: "Lince", theme: "Felinos" },
      { civil: "Jirafa", impostor: "Cebra", theme: "Safari" },
      { civil: "Camello", impostor: "Llama", theme: "Desierto" },
      { civil: "Koala", impostor: "Panda", theme: "Tiernos" },
      { civil: "Leon", impostor: "Tigre", theme: "Felinos" },
      { civil: "Delfin", impostor: "Foca", theme: "Marinos" },
      { civil: "Tiburon", impostor: "Mantaraya", theme: "Marinos" },
      { civil: "Aguila", impostor: "Halcon", theme: "Aves" },
      { civil: "Oso polar", impostor: "Grizzly", theme: "Osos" },
    ],
  },
  {
    id: "naturaleza-clima",
    name: "Naturaleza y clima",
    pairs: [
      { civil: "Oceano", impostor: "Lago", theme: "Agua" },
      { civil: "Desierto", impostor: "Sabana", theme: "Climas" },
      { civil: "Bosque", impostor: "Selva", theme: "Verde" },
      { civil: "Volcan", impostor: "Geyser", theme: "Geologia" },
      { civil: "Cascada", impostor: "Riachuelo", theme: "Agua" },
      { civil: "Nube", impostor: "Niebla", theme: "Cielo" },
      { civil: "Trueno", impostor: "Relampago", theme: "Tormenta" },
      { civil: "Isla", impostor: "Peninsula", theme: "Geografia" },
      { civil: "Glaciar", impostor: "Iceberg", theme: "Hielo" },
      { civil: "Meteoro", impostor: "Cometa", theme: "Espacio" },
    ],
  },
  {
    id: "lugares-viajes",
    name: "Lugares y viajes",
    pairs: [
      { civil: "Playa", impostor: "Piscina", theme: "Verano" },
      { civil: "Montana", impostor: "Colina", theme: "Altura" },
      { civil: "Parque", impostor: "Plaza", theme: "Ciudad" },
      { civil: "Museo", impostor: "Galeria", theme: "Arte" },
      { civil: "Biblioteca", impostor: "Libreria", theme: "Lectura" },
      { civil: "Aeropuerto", impostor: "Estacion", theme: "Viaje" },
      { civil: "Camping", impostor: "Glamping", theme: "Aventura" },
      { civil: "Hotel", impostor: "Hostal", theme: "Hospedaje" },
      { civil: "Safari", impostor: "Zoo", theme: "Animales" },
      { civil: "Rascacielos", impostor: "Edificio", theme: "Ciudad" },
    ],
  },
  {
    id: "hogar-ciudad",
    name: "Hogar y ciudad",
    pairs: [
      { civil: "Cama", impostor: "Sofa", theme: "Casa" },
      { civil: "Cocina", impostor: "Comedor", theme: "Casa" },
      { civil: "Balcon", impostor: "Terraza", theme: "Casa" },
      { civil: "Aspiradora", impostor: "Escoba", theme: "Limpieza" },
      { civil: "Jabon", impostor: "Detergente", theme: "Limpieza" },
      { civil: "Lampara", impostor: "Foco", theme: "Luz" },
      { civil: "Jardin", impostor: "Patio", theme: "Exterior" },
      { civil: "Alarma", impostor: "Cerradura", theme: "Seguridad" },
      { civil: "Cuadro", impostor: "Espejo", theme: "Decoracion" },
      { civil: "Ascensor", impostor: "Escalera", theme: "Edificios" },
    ],
  },
  {
    id: "arte-entretenimiento",
    name: "Arte y entretenimiento",
    pairs: [
      { civil: "Cine", impostor: "Teatro", theme: "Escena" },
      { civil: "Serie", impostor: "Pelicula", theme: "Pantalla" },
      { civil: "Podcast", impostor: "Radio", theme: "Audio" },
      { civil: "Blog", impostor: "Newsletter", theme: "Escritura" },
      { civil: "Pintura", impostor: "Escultura", theme: "Arte" },
      { civil: "Danza", impostor: "Ballet", theme: "Movimiento" },
      { civil: "Concierto", impostor: "Festival", theme: "Musica" },
      { civil: "Batman", impostor: "Robin", theme: "Comics" },
      { civil: "Iron Man", impostor: "Capitan", theme: "Comics" },
      { civil: "Juego de mesa", impostor: "Cartas", theme: "Ocio" },
    ],
  },
  {
    id: "profesiones",
    name: "Profesiones y oficios",
    pairs: [
      { civil: "Doctor", impostor: "Enfermero", theme: "Salud" },
      { civil: "Chef", impostor: "Cocinero", theme: "Cocina" },
      { civil: "Ingeniero", impostor: "Arquitecto", theme: "Planeacion" },
      { civil: "Profesor", impostor: "Tutor", theme: "Educacion" },
      { civil: "Piloto", impostor: "Capitan", theme: "Transporte" },
      { civil: "Fotografo", impostor: "Camarografo", theme: "Visual" },
      { civil: "Periodista", impostor: "Reportero", theme: "Medios" },
      { civil: "Abogado", impostor: "Notario", theme: "Legal" },
      { civil: "Carpintero", impostor: "Ebanista", theme: "Madera" },
      { civil: "Jardinero", impostor: "Florista", theme: "Verde" },
    ],
  },
  {
    id: "juegos-geek",
    name: "Juegos y geek",
    pairs: [
      { civil: "Minecraft", impostor: "Roblox", theme: "Sandbox" },
      { civil: "Switch", impostor: "PlayStation", theme: "Consolas" },
      { civil: "VR", impostor: "AR", theme: "Inmersion" },
      { civil: "Battle Royale", impostor: "Survival", theme: "Generos" },
      { civil: "Puzzle", impostor: "Tetris", theme: "Logica" },
      { civil: "E-sports", impostor: "Arcade", theme: "Competencia" },
      { civil: "Rol", impostor: "Dungeon", theme: "Mesa" },
      { civil: "Estrategia", impostor: "RTS", theme: "PC" },
      { civil: "Pokemon", impostor: "Digimon", theme: "Monstruos" },
      { civil: "Mario", impostor: "Luigi", theme: "Nintendo" },
    ],
  },
  {
    id: "transporte",
    name: "Vehiculos y transporte",
    pairs: [
      { civil: "Avion", impostor: "Helicoptero", theme: "Aire" },
      { civil: "Camion", impostor: "Tren", theme: "Carga" },
      { civil: "Taxi", impostor: "Uber", theme: "Ciudad" },
      { civil: "Bicicleta", impostor: "Patineta", theme: "Urbano" },
      { civil: "Autobus", impostor: "Tranvia", theme: "Publico" },
      { civil: "Metro", impostor: "Cercanias", theme: "Publico" },
      { civil: "Moto", impostor: "Scooter", theme: "Dos ruedas" },
      { civil: "Barco", impostor: "Ferry", theme: "Agua" },
      { civil: "Cohete", impostor: "Satelite", theme: "Espacio" },
      { civil: "Velero", impostor: "Yate", theme: "Mar" },
    ],
  },
  {
    id: "ciencia-espacio",
    name: "Ciencia y espacio",
    pairs: [
      { civil: "Laboratorio", impostor: "Observatorio", theme: "Lugares" },
      { civil: "Microscopio", impostor: "Telescopio", theme: "Instrumentos" },
      { civil: "ADN", impostor: "Proteina", theme: "Biologia" },
      { civil: "Robot", impostor: "Drone", theme: "Futuro" },
      { civil: "Eclipse", impostor: "Equinoccio", theme: "Cielo" },
      { civil: "Astronauta", impostor: "Cosmonauta", theme: "Espacio" },
      { civil: "Quimica", impostor: "Fisica", theme: "Ciencia" },
      { civil: "Gravedad", impostor: "Inercia", theme: "Fuerzas" },
      { civil: "Cohete", impostor: "Sonda", theme: "Exploracion" },
      { civil: "Planeta", impostor: "Asteroide", theme: "Espacio" },
    ],
  },
  {
    id: "fiesta-ocio",
    name: "Fiesta y ocio",
    pairs: [
      { civil: "Discoteca", impostor: "Bar", theme: "Noche" },
      { civil: "Karaoke", impostor: "Serenata", theme: "Musica" },
      { civil: "Picnic", impostor: "BBQ", theme: "Comida" },
      { civil: "Casino", impostor: "Bingo", theme: "Juegos" },
      { civil: "Carnaval", impostor: "Feria", theme: "Eventos" },
      { civil: "Festival", impostor: "Concierto", theme: "Musica" },
      { civil: "Spa", impostor: "Sauna", theme: "Relax" },
      { civil: "Patinaje", impostor: "Bolos", theme: "Ocio" },
      { civil: "Escape room", impostor: "Laser tag", theme: "Juegos" },
      { civil: "Brunch", impostor: "Coffee break", theme: "Comida" },
    ],
  },
  {
    id: "historia-cultura",
    name: "Historia y cultura",
    pairs: [
      { civil: "Piramide", impostor: "Templo", theme: "Antiguo" },
      { civil: "Opera", impostor: "Sinfonia", theme: "Musica" },
      { civil: "Mural", impostor: "Grafiti", theme: "Arte" },
      { civil: "Monarquia", impostor: "Imperio", theme: "Gobierno" },
      { civil: "Revolucion", impostor: "Golpe", theme: "Historia" },
      { civil: "Mitologia", impostor: "Leyenda", theme: "Relatos" },
      { civil: "Gladiador", impostor: "Samurai", theme: "Guerreros" },
      { civil: "Pergamino", impostor: "Manuscrito", theme: "Escritura" },
      { civil: "Reloj solar", impostor: "Calendario", theme: "Tiempo" },
      { civil: "Castillo", impostor: "Fortaleza", theme: "Construcciones" },
    ],
  },
];

const ALL_WORDS: WordPair[] = WORD_CATEGORIES.flatMap(
  (category) => category.pairs,
);

export const WORD_CATEGORY_SUMMARY = WORD_CATEGORIES.map((category) => ({
  id: category.id,
  name: category.name,
  count: category.pairs.length,
}));

export const getCategoryById = (categoryId?: string): WordCategory | undefined =>
  WORD_CATEGORIES.find((category) => category.id === categoryId);

export function getRandomWordPair(categoryId?: string): WordPair {
  const category = getCategoryById(categoryId);
  const pool = category ? category.pairs : ALL_WORDS;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}
