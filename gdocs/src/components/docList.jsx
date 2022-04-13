import { useParams, useNavigate, Link } from "react-router-dom";
import { useCookies } from 'react-cookie';
import { useEffect, useState } from 'react'
import DocItem from './docItem'

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
            console.log("printing docs")
            console.log(docs)
            if (docs) console.log(docs)
        }
        fetchDocs()
    }, []) // ITS A WARNING BUT IT MUST STAY THIS WAY

    return (
        <div style={{ border: "1px solid black", padding: 10 }}>
            <div style={{ fontWeight: "bold", fontSize: 30 }}>10 Recently Edited Documents:</div>
            <div style={{ display: "flex", flexDirection: "column"}}>
                {docs.map((obj) => <DocItem key={obj.id} id={obj.id} name={obj.name} /> )}
            </div>
        </div>
    );
}