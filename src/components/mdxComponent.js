import * as React from 'react';
import Box from '@mui/material/Box';



/////////////////////////////////////////////////////////////////////////

export function BoxHighlight({input}){
    var color="#DEEBFF";
    var text;
    if(input['color'] !== undefined){
        color=input['color'];
    }
    if (input['text']=== undefined){
        text=input
    }else{
        text=input['text']
    }
    console.log(input)
    return(
        <Box
        sx={{
            width: "90%",
            backgroundColor: color,
            borderRadius: '1vh',
            paddingTop: '0.002vh',
            paddingBottom: '0.002vh',
            paddingLeft: '1%',
            paddingRight: '1%',
        }}>
            <p>{text}</p>
        </Box>
    );
}


/// BoxHighlight Usage:

/* const input={
    text: "Something",
    color: "red"
  }
<BoxHighlight input={input}/>
<BoxHighlight input="This is nice"/> */

///////////////////////////////////////////////////////////////////////////////////

