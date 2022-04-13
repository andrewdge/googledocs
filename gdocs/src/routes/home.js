import { useParams } from "react-router-dom";
import { getInvoice } from '../data';

export default function Home() {
    return (
        <main style={{ padding: "1rem" }}>
          <div>Home: You are logged in</div>
        </main>
    );
}