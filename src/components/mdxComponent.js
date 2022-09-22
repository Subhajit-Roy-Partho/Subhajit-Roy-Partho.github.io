import * as React from 'react';
import Box from '@mui/material/Box';

export function BoxHighlight({input}){
    // if(!(input.color)){
    //     input.color = "#DEEBFF"
    // }
    console.log(input)
    return(
        <Box
        sx={{
            width: "90%",
            backgroundColor: '#DEEBFF',
            borderRadius: '1vh',
            paddingTop: '0.002vh',
            paddingBottom: '0.002vh',
            paddingLeft: '1%',
            paddingRight: '1%',
        }}>
            <p>{input.text}</p>
        </Box>
    );
}