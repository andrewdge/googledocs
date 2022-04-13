import { useParams } from "react-router-dom";
import { useCookies } from 'react-cookie';

export default function Logout() {
    const [cookies, setCookie, removeCookie] = useCookies();

    function logout () {
        removeCookie('name', { path: '/' });
        removeCookie('id', { path: '/' });
        console.log('logged out');
        console.log(cookies);
    }

    return (
        <>
            <button onClick={logout}>
                Logout
            </button>
        </>
    );
}