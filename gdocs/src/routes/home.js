import { useParams } from "react-router-dom";
import { useCookies } from 'react-cookie';
import Logout from "../components/logout"

export default function Home() {
    const [cookies, setCookie] = useCookies(['name', 'id'])
    return (
        <main style={{ padding: "1rem" }}>
          <div>Home: You are logged in</div>
          <h1>Hello {cookies.name} with id {cookies.id}!</h1> 
          <Logout />
        </main>
    );
}