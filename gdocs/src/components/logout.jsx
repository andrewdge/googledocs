import { useParams, useNavigate, Link } from "react-router-dom";
import { useCookies } from 'react-cookie';

export default function Logout() {
    // const [cookies, setCookie, removeCookie] = useCookies();
    let navigate = useNavigate();

    async function logout () {
        // removeCookie('name', { path: '/' });
        // removeCookie('id', { path: '/' });
        // console.log('logged out');
        // console.log(cookies);
        let req = await fetch('/users/logout', {
            method: "POST",
            header: {
                'Accept': '*/*',
                'credentials': 'include'
            }
        });
        if (req) {
            console.log('received');
        }
        navigate("/");
    }

    return (
        <>
            <button onClick={logout}>
                Logout
            </button>
        </>
    );
}