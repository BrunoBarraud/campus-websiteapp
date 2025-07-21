interface NavLink {
  id: number;
  url: string;
  label: string;
}

const navLinks: NavLink[] = [
  // Links eliminados: Dashboard, Calendario, Perfil y Configuración
  // ya están disponibles en el menú lateral izquierdo
];

export default navLinks;