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
  horario: "",
  delivery: "Delivery en Piura: coordinamos el costo del envío por WhatsApp.",                      // ej: "Lunes a sábado de 10:00 a. m. a 9:00 p. m."

  // Pega aquí el link de cada red. Si queda vacío "", no se muestra.
  facebook: "",
  instagram: "",
  tiktok: "https://www.tiktok.com/@grupostreet",
};

// ------------------------------------------------------------
//  MÉTODOS DE PAGO que el cliente elige al hacer su pedido en la web.
// ------------------------------------------------------------
const PAGOS_WEB = [
  { nombre: "Yape / Plin", detalle: "Yapea o plinea al 943 369 367 y envíanos la captura por WhatsApp." },
  { nombre: "Transferencia bancaria", detalle: "Te enviamos el número de cuenta por WhatsApp." },
  { nombre: "Efectivo o tarjeta al recoger o recibir", detalle: "Pagas en la tienda o al recibir tu pedido." },
];

// ------------------------------------------------------------
//  CATÁLOGO DE RESPALDO
//  Mientras el sistema de ventas no tenga productos con stock, la web muestra esta lista
//  y los pedidos van por WhatsApp. Cuando el sistema tenga productos, se usan esos
//  (con su stock real) y estas fotos se toman si el nombre del producto es el mismo.
//  foto: nombre del archivo subido a la carpeta img/productos
//        (ej: "polo-negro.jpg"). Si queda vacío "", se muestra
//        un espacio gris con el logo.
//  precio: número sin "S/" (ej: 59.90). Si queda vacío "",
//        dice "Consultar precio".
//  categoria: Polos hombre, Poleras dama, etc. (crea los filtros)
//  detalle: texto corto debajo del nombre (modelo, tela). Puede ir vacío "".
// ------------------------------------------------------------

const PRODUCTOS = [
  { nombre: "Polo oversize Gangster", categoria: "Polos hombre", detalle: "Oversize · Algodón 100% 20/1", precio: 30, foto: "polo-h-ov-01.jpg" },
  { nombre: "Polo oversize Vintage 1988", categoria: "Polos hombre", detalle: "Oversize · Algodón 100% 20/1", precio: 30, foto: "polo-h-ov-02.jpg" },
  { nombre: "Polo oversize Ezseta", categoria: "Polos hombre", detalle: "Oversize · Algodón 100% 20/1", precio: 30, foto: "polo-h-ov-03.jpg" },
  { nombre: "Polo oversize Billionaire", categoria: "Polos hombre", detalle: "Oversize · Algodón 100% 20/1", precio: 30, foto: "polo-h-ov-04.jpg" },
  { nombre: "Polo oversize Storm", categoria: "Polos hombre", detalle: "Oversize · Algodón 100% 20/1", precio: 30, foto: "polo-h-ov-05.jpg" },
  { nombre: "Polo oversize Disciplina", categoria: "Polos hombre", detalle: "Oversize · Algodón 100% 20/1", precio: 30, foto: "polo-h-ov-06.jpg" },
  { nombre: "Polo oversize Tribal blanco", categoria: "Polos hombre", detalle: "Oversize · Algodón 100% 20/1", precio: 30, foto: "polo-h-ov-07.jpg" },
  { nombre: "Polo oversize Tribal negro", categoria: "Polos hombre", detalle: "Oversize · Algodón 100% 20/1", precio: 30, foto: "polo-h-ov-08.jpg" },
  { nombre: "Polo oversize Ancestral", categoria: "Polos hombre", detalle: "Oversize · Algodón 100% 20/1", precio: 30, foto: "polo-h-ov-09.jpg" },
  { nombre: "Polo boxy fit Tribal 97", categoria: "Polos hombre", detalle: "Boxy fit · Algodón 100% 20/1", precio: 35, foto: "polo-h-bf-01.jpg" },
  { nombre: "Polo boxy fit Tredek 89", categoria: "Polos hombre", detalle: "Boxy fit · Algodón 100% 20/1", precio: 35, foto: "polo-h-bf-02.jpg" },
  { nombre: "Polo boxy fit Alas tribales", categoria: "Polos hombre", detalle: "Boxy fit · Algodón 100% 20/1", precio: 35, foto: "polo-h-bf-03.jpg" },
  { nombre: "Polo boxy fit Tribal espalda", categoria: "Polos hombre", detalle: "Boxy fit · Algodón 100% 20/1", precio: 35, foto: "polo-h-bf-04.jpg" },
  { nombre: "Polo boxy fit Tribal crema", categoria: "Polos hombre", detalle: "Boxy fit · Algodón 100% 20/1", precio: 35, foto: "polo-h-bf-05.jpg" },
  { nombre: "Polo boxy fit Ninety Nine 99", categoria: "Polos hombre", detalle: "Boxy fit · Algodón 100% 20/1", precio: 35, foto: "polo-h-bf-06.jpg" },
  { nombre: "Polo boxy fit Tribal blanco", categoria: "Polos hombre", detalle: "Boxy fit · Algodón 100% 20/1", precio: 35, foto: "polo-h-bf-07.jpg" },
  { nombre: "Polo boxy fit Blood", categoria: "Polos hombre", detalle: "Boxy fit · Algodón 100% 20/1", precio: 35, foto: "polo-h-bf-08.jpg" },
  { nombre: "Polo boxy fit Tribal full print", categoria: "Polos hombre", detalle: "Boxy fit · Algodón 100% 20/1", precio: 35, foto: "polo-h-bf-09.jpg" },
  { nombre: "Polo regular fit Archive blanco", categoria: "Polos hombre", detalle: "Regular fit · Algodón 100% 20/1", precio: 30, foto: "polo-h-rf-01.jpg" },
  { nombre: "Polo regular fit Tribal verde olivo", categoria: "Polos hombre", detalle: "Regular fit · Algodón 100% 20/1", precio: 30, foto: "polo-h-rf-02.jpg" },
  { nombre: "Polo regular fit Espinas", categoria: "Polos hombre", detalle: "Regular fit · Algodón 100% 20/1", precio: 30, foto: "polo-h-rf-03.jpg" },
  { nombre: "Polo regular fit Flores", categoria: "Polos hombre", detalle: "Regular fit · Algodón 100% 20/1", precio: 30, foto: "polo-h-rf-04.jpg" },
  { nombre: "Polo regular fit Tribal verde", categoria: "Polos hombre", detalle: "Regular fit · Algodón 100% 20/1", precio: 30, foto: "polo-h-rf-05.jpg" },
  { nombre: "Polo regular fit Tribalism", categoria: "Polos hombre", detalle: "Regular fit · Algodón 100% 20/1", precio: 30, foto: "polo-h-rf-06.jpg" },
  { nombre: "Polo regular fit Goku", categoria: "Polos hombre", detalle: "Regular fit · Algodón 100% 20/1", precio: 30, foto: "polo-h-rf-07.jpg" },
  { nombre: "Polo regular fit Tribal beige", categoria: "Polos hombre", detalle: "Regular fit · Algodón 100% 20/1", precio: 30, foto: "polo-h-rf-08.jpg" },
  { nombre: "Polo regular fit Perfection", categoria: "Polos hombre", detalle: "Regular fit · Algodón 100% 20/1", precio: 30, foto: "polo-h-rf-09.jpg" },
  { nombre: "Polera Tribal con cierre", categoria: "Poleras hombre", detalle: "Franela reactiva", precio: 60, foto: "polera-h-01.jpg" },
  { nombre: "Polera Legendary", categoria: "Poleras hombre", detalle: "Franela reactiva", precio: 60, foto: "polera-h-02.jpg" },
  { nombre: "Polera Varsity 20", categoria: "Poleras hombre", detalle: "Franela reactiva", precio: 60, foto: "polera-h-03.jpg" },
  { nombre: "Polera Life", categoria: "Poleras hombre", detalle: "Franela reactiva", precio: 60, foto: "polera-h-04.jpg" },
  { nombre: "Polera Bicolor", categoria: "Poleras hombre", detalle: "Franela reactiva", precio: 60, foto: "polera-h-05.jpg" },
  { nombre: "Polera Spider", categoria: "Poleras hombre", detalle: "Franela reactiva", precio: 60, foto: "polera-h-06.jpg" },
  { nombre: "Polera Tribal capucha", categoria: "Poleras hombre", detalle: "Franela reactiva", precio: 60, foto: "polera-h-07.jpg" },
  { nombre: "Polera Archive", categoria: "Poleras hombre", detalle: "Franela reactiva", precio: 60, foto: "polera-h-08.jpg" },
  { nombre: "Polera Art Works", categoria: "Poleras hombre", detalle: "Franela reactiva", precio: 60, foto: "polera-h-09.jpg" },
  { nombre: "Jean cargo gris", categoria: "Jeans hombre", detalle: "Cargo", precio: 70, foto: "jean-h-01.jpg" },
  { nombre: "Jean cargo celeste", categoria: "Jeans hombre", detalle: "Cargo", precio: 70, foto: "jean-h-02.jpg" },
  { nombre: "Jean cargo beige", categoria: "Jeans hombre", detalle: "Cargo", precio: 70, foto: "jean-h-03.jpg" },
  { nombre: "Jean baggy cargo negro", categoria: "Jeans hombre", detalle: "Baggy cargo", precio: 70, foto: "jean-h-04.jpg" },
  { nombre: "Jean baggy celeste", categoria: "Jeans hombre", detalle: "Baggy", precio: 70, foto: "jean-h-05.jpg" },
  { nombre: "Jean baggy con strass", categoria: "Jeans hombre", detalle: "Baggy", precio: 70, foto: "jean-h-06.jpg" },
  { nombre: "Jean cargo azul", categoria: "Jeans hombre", detalle: "Cargo", precio: 70, foto: "jean-h-07.jpg" },
  { nombre: "Jean baggy azul", categoria: "Jeans hombre", detalle: "Baggy", precio: 70, foto: "jean-h-08.jpg" },
  { nombre: "Jean cargo negro", categoria: "Jeans hombre", detalle: "Cargo", precio: 70, foto: "jean-h-09.jpg" },
  { nombre: "Polo oversize Brooklyn gris", categoria: "Polos dama", detalle: "Oversize · Algodón 100% 20/1", precio: 25, foto: "polo-d-ov-01.jpg" },
  { nombre: "Polo oversize Oxy", categoria: "Polos dama", detalle: "Oversize · Algodón 100% 20/1", precio: 25, foto: "polo-d-ov-02.jpg" },
  { nombre: "Polo oversize Speed", categoria: "Polos dama", detalle: "Oversize · Algodón 100% 20/1", precio: 25, foto: "polo-d-ov-03.jpg" },
  { nombre: "Polo oversize Retro 80", categoria: "Polos dama", detalle: "Oversize · Algodón 100% 20/1", precio: 25, foto: "polo-d-ov-04.jpg" },
  { nombre: "Polo oversize Sweetheart", categoria: "Polos dama", detalle: "Oversize · Algodón 100% 20/1", precio: 25, foto: "polo-d-ov-05.jpg" },
  { nombre: "Polo oversize Brooklyn blanco", categoria: "Polos dama", detalle: "Oversize · Algodón 100% 20/1", precio: 25, foto: "polo-d-ov-06.jpg" },
  { nombre: "Polo oversize Nirvana", categoria: "Polos dama", detalle: "Oversize · Algodón 100% 20/1", precio: 25, foto: "polo-d-ov-07.jpg" },
  { nombre: "Polo oversize Lucky", categoria: "Polos dama", detalle: "Oversize · Algodón 100% 20/1", precio: 25, foto: "polo-d-ov-08.jpg" },
  { nombre: "Polo oversize Cats", categoria: "Polos dama", detalle: "Oversize · Algodón 100% 20/1", precio: 25, foto: "polo-d-ov-09.jpg" },
  { nombre: "Top halter turquesa", categoria: "Polos dama", detalle: "Tallas S, M, L, XL", precio: 20, foto: "blusa-d-01.jpg" },
  { nombre: "Top hombros descubiertos rojo", categoria: "Polos dama", detalle: "Tallas S, M, L, XL", precio: 20, foto: "blusa-d-02.jpg" },
  { nombre: "Top transparencias negro", categoria: "Polos dama", detalle: "Tallas S, M, L, XL", precio: 20, foto: "blusa-d-03.jpg" },
  { nombre: "Top asimétrico beige", categoria: "Polos dama", detalle: "Tallas S, M, L, XL", precio: 20, foto: "blusa-d-04.jpg" },
  { nombre: "Top manga larga negro", categoria: "Polos dama", detalle: "Tallas S, M, L, XL", precio: 20, foto: "blusa-d-05.jpg" },
  { nombre: "Top hombros descubiertos blanco", categoria: "Polos dama", detalle: "Tallas S, M, L, XL", precio: 20, foto: "blusa-d-06.jpg" },
  { nombre: "Top manga larga beige", categoria: "Polos dama", detalle: "Tallas S, M, L, XL", precio: 20, foto: "blusa-d-07.jpg" },
  { nombre: "Top asimétrico crema", categoria: "Polos dama", detalle: "Tallas S, M, L, XL", precio: 20, foto: "blusa-d-08.jpg" },
  { nombre: "Top hombros descubiertos marrón", categoria: "Polos dama", detalle: "Tallas S, M, L, XL", precio: 20, foto: "blusa-d-09.jpg" },
  { nombre: "Polera Estrellas", categoria: "Poleras dama", detalle: "Franela reactiva", precio: 55, foto: "polera-d-01.jpg" },
  { nombre: "Polera Letra verde", categoria: "Poleras dama", detalle: "Franela reactiva", precio: 55, foto: "polera-d-02.jpg" },
  { nombre: "Polera Deportiva", categoria: "Poleras dama", detalle: "Franela reactiva", precio: 55, foto: "polera-d-03.jpg" },
  { nombre: "Polera NYC", categoria: "Poleras dama", detalle: "Franela reactiva", precio: 55, foto: "polera-d-04.jpg" },
  { nombre: "Polera Hello Kitty", categoria: "Poleras dama", detalle: "Franela reactiva", precio: 55, foto: "polera-d-05.jpg" },
  { nombre: "Polera New York", categoria: "Poleras dama", detalle: "Franela reactiva", precio: 55, foto: "polera-d-06.jpg" },
  { nombre: "Polera Canguro gris", categoria: "Poleras dama", detalle: "Franela reactiva", precio: 55, foto: "polera-d-07.jpg" },
  { nombre: "Polera Spider", categoria: "Poleras dama", detalle: "Franela reactiva", precio: 55, foto: "polera-d-08.jpg" },
  { nombre: "Polera London", categoria: "Poleras dama", detalle: "Franela reactiva", precio: 55, foto: "polera-d-09.jpg" },
  { nombre: "Jean cargo celeste", categoria: "Jeans dama", detalle: "Cargo", precio: 69.9, foto: "jean-d-01.jpg" },
  { nombre: "Jean cargo azul", categoria: "Jeans dama", detalle: "Cargo", precio: 69.9, foto: "jean-d-02.jpg" },
  { nombre: "Jean cargo beige", categoria: "Jeans dama", detalle: "Cargo", precio: 69.9, foto: "jean-d-03.jpg" },
  { nombre: "Jean baggy cargo vintage", categoria: "Jeans dama", detalle: "Baggy cargo", precio: 69.9, foto: "jean-d-04.jpg" },
  { nombre: "Jean baggy azul oscuro", categoria: "Jeans dama", detalle: "Baggy", precio: 69.9, foto: "jean-d-05.jpg" },
  { nombre: "Jean baggy celeste", categoria: "Jeans dama", detalle: "Baggy", precio: 69.9, foto: "jean-d-06.jpg" },
  { nombre: "Jean cargo celeste claro", categoria: "Jeans dama", detalle: "Cargo", precio: 69.9, foto: "jean-d-07.jpg" },
  { nombre: "Jean baggy rasgado", categoria: "Jeans dama", detalle: "Baggy", precio: 69.9, foto: "jean-d-08.jpg" },
  { nombre: "Jean cargo celeste bolsillos", categoria: "Jeans dama", detalle: "Cargo", precio: 69.9, foto: "jean-d-09.jpg" },
];
