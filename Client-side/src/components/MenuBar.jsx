import React, { useContext, useState } from 'react';
import { Container, Icon, Menu } from 'semantic-ui-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { AuthContext } from '../context/auth';

function MenuBar() {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeItem = location.pathname === '/' ? 'home' : location.pathname.split('/')[1];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="topbar">
      <Container>
        <Menu secondary stackable className={mobileOpen ? 'nav-menu is-open' : 'nav-menu'}>
          <Menu.Item header as={Link} to="/" className="brand-mark">
            <Icon name="bolt" />
            NeuralNet Social
          </Menu.Item>
          <Menu.Item
            name="home"
            active={activeItem === 'home'}
            as={Link}
            to="/"
            onClick={() => setMobileOpen(false)}
          />
          <Menu.Menu position="right">
            {user ? (
              <>
                <Menu.Item className="nav-user">
                  <Icon name="user circle" />
                  {user.username}
                </Menu.Item>
                <Menu.Item name="logout" onClick={handleLogout} />
              </>
            ) : (
              <>
                <Menu.Item
                  name="login"
                  active={activeItem === 'login'}
                  as={Link}
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                />
                <Menu.Item
                  name="register"
                  active={activeItem === 'register'}
                  as={Link}
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                />
              </>
            )}
          </Menu.Menu>
          <Menu.Item
            className="mobile-menu-toggle"
            onClick={() => setMobileOpen((open) => !open)}
          >
            <Icon name="bars" />
          </Menu.Item>
        </Menu>
      </Container>
    </header>
  );
}

export default MenuBar;
