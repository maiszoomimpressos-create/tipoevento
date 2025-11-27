import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Força o scroll para o topo (0, 0) em cada mudança de rota
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;