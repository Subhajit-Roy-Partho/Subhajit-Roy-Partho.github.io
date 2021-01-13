
import {CssBaseline, makeStyles} from "@material-ui/core";
import React from "react";
import Header from '../components/Header';
import Image from '../../public/storage/pics/back1.jpg';
import ComponentTwo from "../components/ComponentTwo";
import SEO from "../components/seo"

const useStyles = makeStyles((theme)=>({
    root:{
      minHeight: '100vh',
      backgroundImage: `url(${Image})`,
      backgroundRepeat:"no-repeat",
      backgroundSize: "cover",
    }
  }));


  function App() {
    const classes = useStyles()
    return (
      <div className={classes.root}>
        <SEO title="Home"/>
        <CssBaseline />
        <Header/>
        <ComponentTwo />
      </div>
    );
  }
  
  export default App;