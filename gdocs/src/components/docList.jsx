import { useParams, useNavigate, Link } from "react-router-dom";
import { useCookies } from 'react-cookie';
import { useEffect, useState } from 'react'

export default function DocList() {
    // const [cookies, setCookie, removeCookie] = useCookies();
    let navigate = useNavigate();

    const [docs, setDocs] = useState([])

    

    useEffect(() => {
        const fetchDocs = async () => {
            let req = await fetch('/collection/list', {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json'
                },
            })
            let data = await req.json();
            setDocs(JSON.parse(data));
            if (docs) console.log(docs)
        }
        fetchDocs()
    }, []) // ITS A WARNING BUT IT MUST STAY THIS WAY

    return (
        <>
            <div>Hi</div>
            <ul>{docs.map((obj) => <li key={obj.id}>{obj.id}</li>)}</ul>
        </>
    );
}