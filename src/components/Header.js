import React, { useEffect,useState } from "react"
import {AppBar, Collapse, IconButton, makeStyles, Toolbar} from "@material-ui/core"
import SortIcon from "@material-ui/icons/Sort"
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';


const useStyles = makeStyles((theme)=>({
    root :{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        color: "white"
    },
    appbar :{
        background: 'none',
        fontFamily: 'Lobster',

    },
    appbarTitle:{
        flexGrow: '1',
    },
    appbarToolbar:{
        width: "80%",
        margin: "auto",
    },
    textColor:{
        color: "#0099ff"
    },
    text2:{
        fontFamily: "Lobster",
        textAlign: "center",
        fontSize: "4rem",
    },
    text2Container:{
        textAlign: "center",
    },
    iconDown:{
        color:"#0099ff",
        fontSize: "4rem"
    }

}))

export default function Header() {
    useEffect(()=>{setChecked(true);},[])
    const [checked,setChecked] = useState(false);
    const classes = useStyles();
    return(
        <div className={classes.root}>
            <AppBar className={classes.appbar} elevation={0}>
                <Toolbar className={classes.appbarToolbar}>
                <h1 className={classes.appbarTitle}>My <span className={classes.textColor}>Page</span></h1>
                <IconButton>
                    <SortIcon style={{ color: "white", fontSize: '2rem'}}/>
                </IconButton>
                </Toolbar>
            </AppBar>
            <Collapse in={checked} {...(checked ? {timeout: 1500}:{})} collapsedHeight={40}>
                <div className={classes.text2Container}>
                    <h1 className={classes.text2}>
                        Welcome to<br /> My <span className={classes.textColor}>Website</span>
                    </h1>
                    <IconButton>
                        <ExpandMoreIcon className={classes.iconDown} />
                    </IconButton>
                </div>
            </Collapse>
        </div>
    )
}