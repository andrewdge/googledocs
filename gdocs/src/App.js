import { Outlet, Link } from "react-router-dom";
import Login from "./components/login"
import { useCookies } from 'react-cookie';

export default function App() {
  const [cookies, setCookie] = useCookies(['name'])

  function onChange(newName) {
    setCookie('name', newName, { path: '/' });
  } 
  return (
    // <div>
    //   <h1>Bookkeeper</h1>
    //   <nav
    //     style={{
    //       borderBottom: "solid 1px",
    //       paddingBottom: "1rem",
    //     }}
    //   >
    //     <Link to="/invoices">Invoices</Link> |{" "}
    //     <Link to="/expenses">Expenses</Link>
    //   </nav>
    //   <Outlet />
    // </div>
    <div>
      <div>
        {cookies.name && <h1>Hello {cookies.name}!</h1>}
      </div>
      <Login />
      
    </div>
  );
}
