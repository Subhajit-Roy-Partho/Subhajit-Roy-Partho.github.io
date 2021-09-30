import React from "react"
import { Component } from "react";
import FireLogin from "../service/fireLogin";
import {Button} from "react-bootstrap"

export default class Login extends Component{
    constructor(){
        super();
        this.state={
            username: '',
            password: ''
        }
    }
    handleChange = event => {
        this.setState({
            [event.target.name] : event.target.value,
        })
    };

    onHandleClick(props){
        FireLogin(this.state.email,this.state.password);
        console.log("working")
        this.props.action()
    }
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
                <Button onClick={(props) =>this.onHandleClick(props)}>Login</Button> 
            </div>
           </>
        )
    }
}