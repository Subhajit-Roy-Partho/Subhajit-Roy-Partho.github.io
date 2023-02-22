import React from "react";
import * as queryString from 'query-string;';

export default function Index({location}){
    var userId = queryString.parse(location.search);
    return(
        <p>
            The userID is : {userId}
        </p>
    )
}