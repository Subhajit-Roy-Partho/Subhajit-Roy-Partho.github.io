import axios from "axios";
import { graphql,navigate } from "gatsby";
import * as React from "react";
import { Button } from "theme-ui";

export default function Access(props){
    var originalState = 'something';
    var verify = '';
    if (typeof window != "undefined"){
        React.useEffect(()=>{

            localStorage.getItem('state')
        })
        originalState = String(localStorage.state).substring(1,String(localStorage.state).length-1);
        verify = String(localStorage.challange).substring(1,String(localStorage.challange).length-1);
    }
    // React.useEffect(() => {
    //     if (!windowLoaded){
    //         if (typeof window !== 'undefined' && window){
    //             setWindowLoaded(true)
    //         }
    //     }
    // }, [windowLoaded]);
    // React.useEffect(() => {
    //     if (!initialized && windowLoaded) {
    //         originalState = localStorage.getItem('state')
    //         StorageHelpers.initiateStorage();
        
    //         setInitialized(true);
    //     }
    //     }, [initialized, windowLoaded]);
    var string =["",""];
    string[0] = props.location.search.split("&")[0];
    string[1] = String(props.location.search.split("&")[2]);
    var code = string;
    var state = string;
    // if(typeof window != "undefined"){
        // string = String(props.location.search.split("&"));
        // originalState = localStorage.state.split('"')[1];
    // }
        code = string[0].split("=")[1];
        state = string[1].split("=")[1];
    const clientId = props.data.site.siteMetadata.amazonClientId;
    const clientSecret = props.data.site.siteMetadata.amazonClientSecret;

    console.log(code,state,originalState);
    if (state === originalState){
        console.log("sane");
    }
    function trigger(){
        axios.post('https://api.amazon.com//auth/o2/token',{
            grant_type:'authorization_code',
            code: code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: 'https://subhajit-roy-partho.netlify.app/oauth/access'
            // code_verifier={}
        }).then(function(response){
            console.log(response);
        }).catch(function(error){
            console.log(error);
        })
    }
    return(
        <div>
            {console.log()}
            <Button onClick={()=>{trigger()}}>Something</Button>
        </div>
    )
}

export const query = graphql`
query Amazon2{
    site {
      siteMetadata {
        amazonClientId
        amazonClientSecret
      }
    }
  }`