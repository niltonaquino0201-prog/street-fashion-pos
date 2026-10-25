// ============================================================
//  DATOS DE LA PÁGINA WEB DE STREET FASHIÓN
//  Aquí se cambia todo: contacto, redes y catálogo.
//  Escribe siempre entre comillas "así".
// ============================================================

const NEGOCIO = {
  nombre: "STREET FASHIÓN",
  eslogan: "ELEVANDO TU ESTILO A OTRO NIVEL",
  whatsapp: "51943369367",          // 51 + número, sin espacios
  telefonoVisible: "943 369 367",
  email: "niltonaquino0201@gmail.com",
  direccion: "Villa Casagrande, La Arena, Piura",
  horario: "",                      // ej: "Lunes a sábado de 10:00 a. m. a 9:00 p. m."

  // Pega aquí el link de cada red. Si queda vacío "", no se muestra.
  facebook: "",
  instagram: "",
  tiktok: "https://www.tiktok.com/@grupostreet",
};

// ------------------------------------------------------------
//  CATÁLOGO
//  foto: nombre del archivo subido a la carpeta img/productos
//        (ej: "polo-negro.jpg"). Si queda vacío "", se muestra
//        un espacio gris con el logo.
//  precio: número sin "S/" (ej: 59.90). Si queda vacío "",
//        dice "Consultar precio".
//  categoria: Hombre, Mujer, Niños, Unisex, Accesorios, etc.
// ------------------------------------------------------------

const PRODUCTOS = [
  { nombre: "Polo oversize", categoria: "Unisex", precio: "", foto: "" },
  { nombre: "Polera con capucha", categoria: "Unisex", precio: "", foto: "" },
  { nombre: "Jean slim", categoria: "Hombre", precio: "", foto: "" },
  { nombre: "Jean mom", categoria: "Mujer", precio: "", foto: "" },
  { nombre: "Casaca", categoria: "Unisex", precio: "", foto: "" },
  { nombre: "Jogger", categoria: "Unisex", precio: "", foto: "" },
  { nombre: "Conjunto deportivo", categoria: "Niños", precio: "", foto: "" },
  { nombre: "Gorra", categoria: "Accesorios", precio: "", foto: "" },
];
