import React, { Component } from "react"
// import { Link } from "gatsby"
import 'bootstrap/dist/css/bootstrap.min.css';
import Wave from 'react-wavify';
import {Button, Carousel} from "react-bootstrap"

import Layout from "../components/layout"
import Image from "../components/image"
import SEO from "../components/seo"
import ImageHead from "../components/image_head"
import "./index.css"
//need to remove firebase ui


export default class IndexPage extends Component{
  constructor() {
    super();
    this.state = {
      width:  800,
      height: 182
    }
  }

  /**
   * Calculate & Update state of new dimensions
   */
  updateDimensions() {
    if (typeof window !== `undefined`) {
    if(window.innerWidth < 500) {
      this.setState({ width: 450, height: 102 });
    } else {
      let update_width  = window.innerWidth-100;
      let update_height = Math.round(update_width/4.4);
      this.setState({ width: update_width, height: update_height });
    }
  }
  }

  /**
   * Add event listener
   */
  componentDidMount() {
    this.updateDimensions();
    if (typeof window !== `undefined`) {
    window.addEventListener("resize", this.updateDimensions.bind(this));
  }
}

  /**
   * Remove event listener
   */
  componentWillUnmount() {
    if (typeof window !== `undefined`) {
    window.removeEventListener("resize", this.updateDimensions.bind(this));
    }
  }

// componentDidMount(){
//   if (typeof window !== `undefined`) {
//     const Updatewidth = window.innerWidth-100;
//     this.setState({width:Updatewidth});
//   }
// }

  render(){
    return(
      <Layout>
    <SEO title="Home" />
    <div>
    {/* <Wave mask="url(#mask)" fill="#1277b0"> */}
      {/* <defs> */}
    <Carousel>
      <Carousel.Item>
        <div className="image"><Image /></div>
      </Carousel.Item>
      <Carousel.Item>
        <div className="image"><ImageHead /></div>
      </Carousel.Item>
    </Carousel>
    {/* <mask id="mask">
      <rect x="0" y="0" width="2000" height="200" fill="url(#gradient)"  />
    </mask> */}
    {/* </defs> */}
    {/* </Wave> */}
    <Wave mask="url(#mask2)" fill="white" className="wave" options={{
      height: 20,
      amplitude: 100,
      speed:0.2
    }}/>
    </div>
    <div
        style={{
          margin: `0 auto`,
          maxWidth: 960,
          padding: `0 1.0875rem 1.45rem`,
        }}>
    {/* <h1>Hi people</h1>
    <p>Welcome to your new Gatsby site.</p>
    <p>Now go build something great.</p> */}
    <p><center><Button className="btn-grad align-self-center">Courses Offered</Button></center> </p>
    {/* <p>Width: {this.state.width}</p>
    <p>Height: {this.state.height}</p> */
    
    <div>
      
    </div>
    
    
    
    
    
    }
    {/* <div style={{ maxWidth: `300px`, marginBottom: `1.45rem` }}>
      <Image />

      <ImageHead />
    </div> */}
    {/* <p>This is just </p>
    <br/>
    <br/>
    <br/>
    <p>Plese just work please</p>
    <p>I don't know </p> */}
    {/* <Wave mask="url(#mask)" fill="#1277b0">
  <defs>
    <linearGradient id="gradient" gradientTransform="rotate(90)">
      <stop offset="0" stopColor="white" />
      <stop offset="0.5" stopColor="black" />
    </linearGradient>
    <p>This is wave</p>
    <mask id="mask">
      <rect x="0" y="0" width="2000" height="200" fill="url(#gradient)"  />
    </mask>
  </defs>
</Wave> */}
    {/* <Link to="/page-2/">Go to page 2</Link> <br />
    <Link to="/using-typescript/">Go to "Using TypeScript"</Link> */}
    </div>
  </Layout>
    );
  }
}
