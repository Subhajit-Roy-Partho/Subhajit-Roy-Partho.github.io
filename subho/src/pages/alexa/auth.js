import * as React from "react";
import queryString from 'query-string';


export default function Index({location}){
    var userId = queryString.parse(location.search);
    return(
        <div>
            <h1>Developing</h1>
            <p>
                The userID is : {userId}
            </p>
        </div>
    )
}