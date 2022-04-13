import { useParams } from "react-router-dom";
import { useCookies } from 'react-cookie';

export default function Logout() {
    const [cookies, setCookie, removeCookie] = useCookies();

    async function logout () {
        removeCookie('name', { path: '/' });
        removeCookie('id', { path: '/' });
        console.log('logged out');
        console.log(cookies);
        let req = await fetch('/users/logout', {
            method: "POST",
            header: {
                'Accept': '*/*'
            }
        })
        if (req) console.log('received')
    }

    return (
        <>
            <button onClick={logout}>
                Logout
            </button>
        </>
    );
}