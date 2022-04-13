import { Outlet, Link } from "react-router-dom";
import Login from "./components/login"
import Logout from "./components/logout"
import { useCookies } from 'react-cookie';

export default function App() {
  const [cookies, setCookie] = useCookies(['name', 'id']);
  console.log(cookies);


  // function onChange(newName) {
  //   setCookie('name', newName, { path: '/' });
  // } 
  return (
    <div>
      <div>
        {cookies.name ? 
        <>
          <h1>Hello {cookies.name} with id {cookies.id}!</h1> 
          <Logout />
        </>
        : 
        <Login />}
      </div>
      
    </div>
  );
}
