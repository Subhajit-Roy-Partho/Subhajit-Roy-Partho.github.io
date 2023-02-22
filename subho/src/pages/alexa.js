import React, { useState } from "react";
import { Link, navigate} from "gatsby";

export default function Alexa(props){
    const userId = props.location.search.split("?")[1]
    const [username,setUsername] = useState("");
    const [password,setPassword] = useState("");
    console.log(userId);
    return(
        <div>
        <p>
            Things are in order.
        </p>
        <p>
            <img src="https://images-na.ssl-images-amazon.com/images/G/01/lwa/btnLWA_gry_156x132.png"></img>
        </p>
        </div>
    )
}