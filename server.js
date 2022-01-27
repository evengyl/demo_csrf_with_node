const express = require("express")
const app = express()
const port = process.env.PORT || 3000
const cookieParser = require("cookie-parser")
const session = require("express-session")
const uuid = require("uuid")

app.use(express.json()); // support json encoded bodies
app.use(express.urlencoded({ extended: true })); // support encoded bodies for form http post


app.use(cookieParser())

app.set('trust proxy', 1)
app.use(session({
    resave : true,
    saveUninitialized : false,
    secret : "turlututuchapeaupointu",
    cookie : { maxAge : 1000 * 60 * 60 * 24},
}))

app.use(express.static('content')); // define static content for css, pictures, scripts...
app.engine('html', require('ejs').renderFile); // view engine for nodeJS 

//partie résolution du problème de csrf
//middleware pour générer le token 
var regenerateToken = (req, res, next) => {
    req.session.uuid = uuid.v4()
    next()
}

var verifyToken = (req, res, next) => {
    if(req.session.uuid == req.query.token)
        next()
    else
        res.redirect("/")
}

//fin

var datas = require("./data/fake.json")


app.get('/', (req, res, next) => { 
    console.log(req.session.uuid)
   res.render("index.ejs", { datas : datas, token : req.session.uuid})
})

//pour le fake
var userIdConnected = ""

app.get("/login/:id", regenerateToken, (req, res, next) => {
    userIdConnected = uuid.v4()

    res.cookie("UserUuid", userIdConnected)
    res.cookie("UserId", req.params.id)
    console.log(`User ${req.params.id} : logged`)
    res.redirect("/")
})
//-------------------------------


app.get("/deleteMessage/:id", /*verifyToken,*/ (req, res, next) => {

    if(req.cookies.UserUuid == userIdConnected)
    {
        datas = datas.filter((item) => {
            
            if(item.id != req.params.id){
                return item
            }
            else //so equals
            {
                if(item.userId != req.cookies.UserId)
                    return item
            }
        })
        console.log("message supprimé")
        res.redirect("/")
    }
    else{
        //n'a pas le droit de supprimer 
        console.log("n'a pas le droit de supprimer")
        res.redirect("/")
    }
})



/*
lorsque tout est prèt, engendrer dans le json, un mise a jour d'un message pour essayer de faire delte un post
-> {
        "id" : 3,
        "user" : "Steve",
        "userId" : 2,
        "message" : "Lorem ipsum dolor sit amet consectetur adipisicing elit. Numquam doloribus esse cupiditate quia odit, eius eligendi provident nemo saepe quae."
    },
    par ->
    {
        "id" : 3,
        "user" : "Steve",
        "userId" : 2,
        "message" : "<img src='/deleteMessage/3' />"
    },

    --> lorsque le user 1 va se connecter pas de soucis rien ne va se passer, mais quand le user 2 va se connecter !
    et que sur la page il y a une image portant le lien vers la suppression de son propre poste, 
    il sera tout bonnement supprimer car user 2 est bien connecté
*/




app.use((err, req, res, next) => {
    res.status(500).json({
        message : err.message
    })
})


app.listen(port, console.log(`Les serveur Express écoute sur le port ${port}`))
