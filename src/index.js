










import React, {useState, useEffect} from "react";
import {createRoot} from "react-dom/client"
import Axios from "axios"
import CreateNewForm from "./components/CreatNewForm"
import AnimalCard from "./components/AnimalCard"

function App(){
    const [animals, setAnimals] = useState([])
    useEffect(()=>{
        async function goStart(){
            const response =await Axios.get("/api/animals")
            setAnimals(response.data)
        }
        goStart()
    },[])
    //const animals=[
    //    {name:"Meowsalot", species:"Cat"},
    //    {name:"Barksalot", species:"Dog"}
    //] 
    //<h1>Hello From Mike</h1>

    //<p>This is React live</p>
    
    return(
        <div className="container">
            <p><a href="/">&laquo; Back to my Homepage</a></p>
            <CreateNewForm setAnimals={setAnimals} />
            <div className="animal-grid">
                {animals.map(function(animal){
                    return <AnimalCard key={animal._id} name={animal.name}  
                    species={animal.species} photo={animal.photo} id={animal._id} 
                    setAnimals={setAnimals}/>
                })}
            </div>  
        </div>
    )
}

//function AnimalCards(props){
//    return <p> Hi, my name is {props.name} and I am a {props.species}.</p>

//}
const root = createRoot(document.querySelector("#app")) 

root.render(<App />)
