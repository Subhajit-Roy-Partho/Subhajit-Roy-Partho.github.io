import React, { Component } from "react";
import {Button} from "react-bootstrap";
import firebase from "./fire";



class Signup extends Component{
    constructor() {
        super();
        this.state = {
            email: '',
            password: ''
        };
      };
    handleChange = event => {
        this.setState({
            [event.target.name] : event.target.value,
        })
    };
    fireSignUp(em,pa){
        firebase.auth().createUserWithEmailAndPassword(em,pa).then(console.log("User registered Successfully")).catch(function (error) {
        //   var errorCode = error.code;
        //   var errorMessage = error.message;
        console.log("Error code"+ error.code);
        console.log("Error Message" + error.message)
        });
      };
    
    render(){
        return(
            <>
            <div><p>Email</p>
            <input name="email" type="text" onChange={this.handleChange} /></div>
            <div>
            <p>Password</p>
            <input name="password" type="password" onChange={this.handleChange} />
            </div>
            <div>
                <Button onClick={() => this.fireSignUp(this.state.email,this.state.password)}>This is button</Button> </div>
            </>
        )
    }
}

export default Signup