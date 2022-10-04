import { Navbar, Nav } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.js';
import { useNavigate } from 'react-router-dom';

export default (props: { pageTitle: string, navBarItems: any[], children: any }) => {
    let navigate = useNavigate();
    return (
        <div>
            <Navbar bg="dark" variant="dark" expand="lg">
                <Navbar.Brand href={"/"}>Pay As you Go VPN</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav 
                        className="mr-auto" 
                        onSelect={                                        
                            (eventKey) => {
                                navigate(eventKey as string)
                            }
                        }
                    >
                        {
                            props.navBarItems.map((item, index) => {
                                return <Nav.Link 
                                        key={index}
                                        onClick={item.onClick}
                                        eventKey={item.destination}
                                        >{item.name}</Nav.Link>
                            })
                        }
                    </Nav>
                </Navbar.Collapse>
            </Navbar>
            <div className="container">
                <h2>{props.pageTitle}</h2>
                {props.children}
            </div>
        </div>
    );
}