import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, NavLink } from "react-router-dom";
import { useAuth } from '@/contexts/auth/AuthContext';
import supabase from '@/utils/supabaseClient';

const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);
  return matches;
};

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-1.5 5.25h16.5" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const Navbar = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const isAuthenticated = auth?.isAuthenticated;
  
  const handleLogout = async () => {
    try {
      console.log("Navbar: Attempting to logout...");
      
      // Clear any local storage items first
      localStorage.removeItem("usuario");
      localStorage.removeItem("last_activity_timestamp");
      
      // Use both the auth context logout and a direct Supabase signOut for redundancy
      // This ensures we cover both the context state and the actual auth session
      await auth.logout();
      
      // Also try a direct signOut as a fallback
      await supabase.auth.signOut();
      
      console.log("Navbar: Logout completed, navigating to home");
      
      // Force a page reload to clear any remaining state
      window.location.href = '/';
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      
      // Even if there's an error, try to navigate home
      navigate("/");
      
      // If all else fails, force a page reload
      if (auth?.isAuthenticated) {
        window.location.reload();
      }
    }
  };

  const isMobile = useMediaQuery("(max-width: 768px)");
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonMenuRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuOpen &&
        menuRef.current && !menuRef.current.contains(event.target as Node) &&
        buttonMenuRef.current && !buttonMenuRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    if (isMobile) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen, isMobile]);

  const navLinkBase = "px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-800 relative";
  const activeClasses = "text-indigo-600 font-semibold after:content-[''] after:absolute after:left-1/2 after:-translate-x-1/2 after:-bottom-1 after:h-[2px] after:w-4/5 after:bg-indigo-600 after:rounded-full";
  const inactiveClasses = "text-neutral-600 hover:text-indigo-600";
  const getClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? `${navLinkBase} ${activeClasses}` : `${navLinkBase} ${inactiveClasses}`;
  const getMobileClass = ({ isActive }: { isActive: boolean }) => {
    const mobileBase = "block px-4 py-3 text-base rounded-md"; // Mobile specific base for larger tap targets
    return isActive ? `${mobileBase} ${navLinkBase} ${activeClasses}` : `${mobileBase} ${navLinkBase} ${inactiveClasses}`;
  };

  const logoutBtn = "px-4 py-2 rounded-md text-sm font-medium text-white bg-red-500 hover:bg-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-800 transition-all duration-200 ease-out transform hover:scale-105 active:scale-95";
  const mobileLogoutBtn = `block w-full text-left px-4 py-3 text-base rounded-md ${logoutBtn}`;

  // Function to handle clicks on logout buttons with event capturing
  const handleLogoutClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent any default behavior
    e.stopPropagation(); // Stop event propagation
    handleLogout(); // Call the logout function
    return false; // Ensure no additional handlers are called
  };

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ease-in-out ${scrolled || menuOpen ? "bg-white shadow-xl backdrop-blur-md" : "bg-transparent shadow-md"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex-shrink-0 text-2xl font-bold text-indigo-600 hover:text-indigo-500 transition-colors duration-200 ease-out transform hover:scale-105 active:scale-100">
            Q-Manager
          </Link>

          {/* Desktop Menu */}
          {!isMobile && (
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-2">
                <NavLink to="/" className={getClass}>Inicio</NavLink>
                
                {/* Enlace al Dashboard para usuarios autenticados */}
                {isAuthenticated && (
                  <NavLink to="/home-user" className={getClass}>Dashboard</NavLink>
                )}
                
                <NavLink to="/about" className={getClass}>Sobre nosotros</NavLink>

                {isAuthenticated ? (
                  <button 
                    onClick={handleLogoutClick}
                    className={logoutBtn}
                  >
                    Cerrar sesión
                  </button>
                ) : (
                  <>
                    <NavLink to="/register-user" className={getClass}>Regístrate</NavLink>
                    <NavLink to="/login" className={getClass}>Iniciar Sesión</NavLink>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
            <button
              ref={buttonMenuRef}
              onClick={() => setMenuOpen(!menuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-neutral-600 hover:text-indigo-600 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-transform duration-300 ease-in-out"
              aria-controls="mobile-menu"
              aria-expanded={menuOpen}
            >
              <span className="sr-only">Abrir menú principal</span>
              <div className="relative w-7 h-7">
                <span className={`absolute inset-0 transition-opacity duration-200 ease-in-out ${menuOpen ? 'opacity-0' : 'opacity-100'}`}>
                  <MenuIcon />
                </span>
                <span className={`absolute inset-0 transition-opacity duration-200 ease-in-out ${menuOpen ? 'opacity-100' : 'opacity-0'}`}>
                  <CloseIcon />
                </span>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobile && (
        <div 
          ref={menuRef} 
          className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${menuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`} 
          id="mobile-menu"
        >
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white shadow-xl rounded-b-lg mx-2 mb-2 border border-t-0 border-gray-200/80">
            <NavLink to="/" className={getMobileClass} onClick={() => setMenuOpen(false)}>Inicio</NavLink>
            
            {/* Enlace al Dashboard para usuarios autenticados */}
            {isAuthenticated && (
              <NavLink to="/home-user" className={getMobileClass} onClick={() => setMenuOpen(false)}>Dashboard</NavLink>
            )}
            
            <NavLink to="/about" className={getMobileClass} onClick={() => setMenuOpen(false)}>Sobre nosotros</NavLink>

            {isAuthenticated ? (
              <button 
                onClick={(e) => { 
                  setMenuOpen(false);
                  handleLogoutClick(e);
                }} 
                className={mobileLogoutBtn}
              >
                Cerrar sesión
              </button>
            ) : (
              <>
                <NavLink to="/register-user" className={getMobileClass} onClick={() => setMenuOpen(false)}>Regístrate</NavLink>
                <NavLink to="/login" className={getMobileClass} onClick={() => setMenuOpen(false)}>Iniciar Sesión</NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
