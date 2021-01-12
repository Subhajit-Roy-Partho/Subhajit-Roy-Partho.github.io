import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
// import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
// import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Card1 from "../../public/storage/pics/card1.jpg"
import { Collapse } from '@material-ui/core';

const useStyles = makeStyles((theme)=>({
  root: {
    maxWidth: '30%',
    minWidth: '30%',
    background: 'rgba(102, 102, 255,0.5)',
    margin: "3%",
    [theme.breakpoints.down("md")]:{
        maxWidth: "80%",
        minWidth: "80%"
    }

  },
  title:{
      fontFamily: "Lobster",
      fontWeight: "Bold",
      color:"white",
  },
  subheading:{
      color: 'rgb(204, 204, 204)',
  },
  Collapse:{
      maxWidth: "100%",
      minWIdth: "100%",
      justifyContent: 'center',
      alignItems: 'center',
  }
}))

export default function ImageCard({Place, checked}) {
  const classes = useStyles();
  return (
    <Card className={classes.root}>
    <Collapse in={checked} {...(checked ? {timeout: 1500}:{})} >
      <CardActionArea>
        <CardMedia
          component="img"
          alt="Contemplative Reptile"
          image={Card1}
          title="Contemplative Reptile"
          height="300vh"
        />
        <CardContent>
          <Typography gutterBottom variant="h5" component="h2">
            <span className={classes.title}>Course 1 </span>
          </Typography>
          <Typography variant="body2" color="textSecondary" component="p">
            <span className={classes.subheading}>Description of the course</span>
          </Typography>
        </CardContent>
      </CardActionArea>
      {/* <CardActions>
        <Button size="small" color="primary">
          Share
        </Button>
        <Button size="small" color="primary">
          Learn More
        </Button>
      </CardActions> */}
      </Collapse>
    </Card>
  );
}