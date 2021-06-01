import React from 'react';
import { Nav, Navbar, Container, Button } from 'react-bootstrap';

const Home = (signOut: any) => {
  const logoutHandler = () => {
    signOut();
  };

  return (
    <div>
      <Navbar>
        <Container>
          <Navbar.Brand href="#home">Navbar with text</Navbar.Brand>
          <Navbar.Toggle />
          <Navbar.Collapse className="justify-content-end">
            <Navbar.Text>
              <Button onClick={logoutHandler}>Log out</Button>
            </Navbar.Text>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <Container style={{ marginTop: '5rem' }}>
        <h1>Home</h1>
      </Container>
    </div>
  );
};

export default Home;
