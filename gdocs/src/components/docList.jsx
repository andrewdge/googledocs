import { useParams, useNavigate, Link } from "react-router-dom";
import { useCookies } from 'react-cookie';
import { useEffect, useState } from 'react'

export default function DocList() {
    // const [cookies, setCookie, removeCookie] = useCookies();
    let navigate = useNavigate();

    const [docs, ignore] = useState('')
    

    useEffect(() => {
        const fetchDocs = async () => {
            let req = await fetch('/collection/list', {
                method: "GET"
            })
            console.log(req)
        }
        fetchDocs()
    }, [])

    return (
        <>
            <div>Hi</div>
        </>
    );
}