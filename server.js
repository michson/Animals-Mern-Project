Noconst {MongoClient, ObjectId} = require("mongodb")
const express = require("express")
const multer = require('multer')
const upload = multer()
const sanitizeHTML =require("sanitize-html")
const fse=require('fs-extra')
const sharp= require('sharp')
let db

const path =require("path")
const React =require('react')
const ReactDOMServer = require('react-dom/server')
const AnimalCard = require("./src/components/AnimalCard").default
const { info } = require("console")
//to Ensure public/uploaded-photos exist on first run of this app. Create if not
fse.ensureDirSync(path.join("public","uploaded-photos"))

const app = express()
app.set("view engine","ejs")
app.set("views","./views")
app.use(express.static("public"))
app.use(express.json())
app.use(express.urlencoded({extended:false}))

function passwordProtected(req,res,next){
    res.set("WWW-Authenticate","Basic realm='Our MERN App'")
    if(req.headers.authorization=="Basic bWljaHNvbjpLeWwzajNyczN5"){
        next()
    }else{
        console.log(req.headers.authorization)
        res.status(401).send("Wrong Password, Try Again!")
    }
}

app.get("/", async (req, res)=>{
    const allAnimals = await db.collection("animals").find().toArray()
    const generatedHTML = ReactDOMServer.renderToString(
        <div className="container">
            {!allAnimals.length && <p>There are no Animals yet, the Admin need to add a few!</p>}
            <div className="animal-grid mb-3">
                {allAnimals.map(animal =><AnimalCard   key={animal._id} name={animal.name}  
                    species={animal.species} photo={animal.photo} id={animal._id} readOnly={true} />)}
            </div>     
            <p><a href="/admin">Login / Manage Animal Listing.</a></p>
        </div>
    )
    res.render("home",{generatedHTML})

})

app.use(passwordProtected)
app.get("/admin",(req,res)=>{
    res.render("admin")
    //res.send("Welcome to Mik Super Secure Admin")
})

app.get("/api/animals", async (req, res)=>{
    const allAnimals = await db.collection("animals").find().toArray()
    res.json(allAnimals)
})

app.post("/create-animal", upload.single("photo"),ourCleanup, async (req, res)=>{
    //if(req.body.name=='null'){
    //}
    if(req.file){
        const photofilename =`${Date.now()}.jpg`
        await sharp(req.file.buffer).resize(844,456).jpeg({quality:60}).toFile(path.join("public","uploaded-photos",photofilename))
        req.cleanData.photo=photofilename
    }
    console.log(req.body)
    const Info = await db.collection("animals").insertOne(req.cleanData)
    const newAnimDetails = await db.collection("animals").findOne({_id: new ObjectId (Info.insertedId)})
    res.send(newAnimDetails)
})

app.delete("/animal/:id", async (req, res)=>{
    if(typeof req.params.id != "string") req.params.id=""
    const doc = await db.collection("animals").findOne({_id: new ObjectId (req.params.id)})
    if(doc.photo){
        fse.remove(path.join("public","uploaded-photos",doc.photo))
    }
    db.collection("animals").deleteOne({_id: new ObjectId (req.params.id)})
    res.send("Delete Done")
})

app.post("/update-animal", upload.single("photo"),ourCleanup, async (req, res)=>{
    if(req.file){ //if new picture is uploaded
        const photofilename =`${Date.now()}.jpg`
        await sharp(req.file.buffer).resize(844,456).jpeg({quality:60}).toFile(path.join("public","uploaded-photos",photofilename))
        req.cleanData.photo=photofilename
        const info = await db.collection("animals").findOneAndUpdate({_id: new ObjectId (req.body._id)},{ $set: req.cleanData})
        if(info.value.photo){
            fse.remove(path.join("public","uploaded-photos", info.value.photo))
        }
        res.send(photofilename)
    }else{//if no new picture is uploaded
        db.collection("animals").findOneAndUpdate({_id: new ObjectId (req.body._id)},{$set: req.cleanData})
        res.send(false )
    }
})

function ourCleanup(req,res,next){
    if(typeof req.body.name!="string") req.body.name=""
    if(typeof req.body.species!="string") req.body.species=""
    if(typeof req.body._id!="string") req.body._id=""

    req.cleanData ={
        name: sanitizeHTML(req.body.name.trim(),{allowedTags:[], allowedAttributes:{}}),
        species: sanitizeHTML(req.body.species.trim(),{allowedTags:[], allowedAttributes:{}})
    }
    next()
}
  
async function start(){
    const client = new MongoClient("mongodb://root:root@localhost:27017/AmazingMernApp?&authSource=admin")
    await client.connect()
    db = client.db()
    app.listen(3000)
}
start()

