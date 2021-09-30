import firebase from "../components/fire"

export default function FireLogin(username, password){
    firebase.auth().signInWithEmailAndPassword(username,password)
    .then((user)=>{
        console.log("Signed in successfully")
    })
    .catch((error)=>{
        console.log(error.code)
        console.log(error.message)
    })
}

export const FireSignOut = ()=>{
    firebase.auth().signOut()
    .then(()=>{
        console.log("Signed Out successfully")
       return true;
    }).catch((error)=>{
        console.log("Some problem")
        return false
    })
}

export const FireCheck = ()=>{
    var user = firebase.auth().currentUser;
    if(user){
        return true;
    }else{
        return false;
    }
}