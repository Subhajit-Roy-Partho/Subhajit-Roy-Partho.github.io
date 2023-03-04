import axios from "axios";
import { graphql,navigate } from "gatsby";
import * as React from "react";
import { Button } from "theme-ui";

export default function Access(props){
    const [accessToken,setAccessToken] = React.useState("something large here | dflkshjflihslfnlks |isfjslkdfjlksfnlk n |fjisdjflsdlkfslnm");
    const [refreshToken,setRefreshToken] = React.useState("something large here | dflkshjflihslfnlks |isfjslkdfjlksfnlk n |fjisdjflsdlkfslnm");
    var originalState = 'something';
    var challange ='';
    if (typeof window != "undefined"){
        React.useEffect(()=>{

            localStorage.getItem('state');
            localStorage.getItem('challange');
        })
        originalState = JSON.parse(localStorage.getItem("state"));
    }

    var string =["",""];
    string[0] = props.location.search.split("&")[0];
    string[1] = String(props.location.search.split("&")[2]);
    var code = string;
    var state = string;

        code = string[0].split("=")[1];
        state = string[1].split("=")[1];
    const clientId = props.data.site.siteMetadata.amazonClientId;
    const clientSecret = props.data.site.siteMetadata.amazonClientSecret;

    if (typeof window != "undefined"){
    challange = String(JSON.parse(localStorage.getItem('challange')));
    console.log(code,state,JSON.parse(localStorage.getItem("state")),challange);
    }
    if (state === challange ){
        console.log("sane");
    }else{
        console.log("Something went worng");
    }
    function trigger(){
        challange = String(JSON.parse(localStorage.getItem('challange')));
        axios.post('https://api.amazon.com//auth/o2/token',{
            grant_type:'authorization_code',
            code: code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: 'https://subhajit-roy-partho.netlify.app/oauth/access'
            // code_verifier: challange
        }).then(function(response){
            console.log(response);
            if (window !== "undefined"){
                localStorage.setItem("access_token",response.data.access_token);
                localStorage.setItem("refresh_token",response.data.refresh_token);
                localStorage.setItem("token",1);
            }
            setAccessToken(String(response.data.access_token));
            setRefreshToken(String(response.data.refresh_token));
            console.log(response.data.access_token,accessToken);
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