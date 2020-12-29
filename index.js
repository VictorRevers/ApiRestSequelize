const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const jwtSecret = "jwtpassword";

const connection = require('./database/database');
const Game = require('./model/Game');
const User = require('./model/User');


const app = express();

app.use(cors());

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

connection.authenticate().then(()=>{
    console.log("DB conectada!");
}).catch((error)=>{
    console.log(error);
});


function Auth(req, res, next){
    const authToken = req.headers['authorization'];
    
    if(authToken != undefined){
        const bearer = authToken.split(' ');
        var token = bearer[1];

        jwt.verify(token, jwtSecret, (err, data)=>{
            if(err){
                res.status(401);
                res.json("Token inválido!");
            }else{
                req.token = token;
                req.loggedUser = {id: data.id, email: data.email};
                next();
            }
        });
    }else{
        res.status(401);
        res.json("Token inválido!");
    }
    
}


app.get('/games', (req, res)=>{
var HATEOAS = [
    {
        href: "http://localhost:5000/game/:id",
        method: "DELETE",
        rel: "delete_game"
    },
    {
        href: "http://localhost:5000/game/:id",
        method: "GET",
        rel: "get_game"
    },
    {
        href: "http://localhost:5000/auth",
        method: "POST",
        rel: "login"
    }
]

    Game.findAll().then((games)=>{
        res.json({
            games:games, 
            _links: HATEOAS
        });
        res.statusCode(200);
    }).catch(error=>{
        res.send(error);
    });
});

app.get('/game/:id', (req, res)=>{
    
    if(isNaN(req.params.id)){
        res.sendStatus(400);
    }else{
        var id = req.params.id;

        Game.findByPk(id).then(game=>{
            if(game != undefined){
                res.json(game);
                res.statusCode = 200;
            }else{
                res.sendStatus(404);
            }
        });
    }
});

app.post('/game', Auth,(req, res)=>{
  var {title, price, year} = req.body;

  if(title == undefined || price == undefined || year == undefined){
      res.sendStatus(406);
  }else{
    Game.create({
        title,
        price,
        year
    }).then(()=>{
        res.sendStatus(200); 
    }).catch(error =>{
        res.json(error);
    });
  }
});

app.delete('/game/:id', (req, res)=>{
    if(isNaN(req.params.id)){
        res.sendStatus(400);
    }else{
        var id = parseInt(req.params.id);

        Game.findByPk(id).then(game=>{
            if(game == undefined){
                res.sendStatus(404);
            }else{
                Game.destroy({
                    where:{
                        id
                    }
                }).then(()=>{
                    res.sendStatus(200);
                }); 
            }
        })
    }    
});

app.put('/game/:id', (req, res)=>{
    if(isNaN(req.params.id)){
        res.sendStatus(400);
    }else{
        var id = parseInt(req.params.id);

        Game.findByPk(id).then(game=>{
            if(game != undefined){
                var {title, price, year} = req.body;
    
                if(title != undefined){
                     Game.update({
                         title
                     },{
                         where:{
                             id
                         }
                     });
                }
                if(price != undefined){
    
                    if(isNaN(price)){
                        res.sendStatus(400);
                    }else{
                        Game.update({
                            price
                        },{
                            where:{
                                id
                            }
                        });
                    }
                }
                if(year != undefined){
                    if(isNaN(year)){
                        res.sendStatus(400);
                    }else{
                        Game.update({
                            year
                        },{
                            where:{
                                id
                            }
                        });
                    } 
                }
                res.sendStatus(200);
    
            }else{
                res.sendStatus(404);
            }
        });
    }
});


app.post('/user', (req, res)=>{
    var name = req.body.name;
    var email = req.body.email;
    var password = req.body.password;
    User.findOne({where: {email: email}}).then(user=>{
        if(user == undefined){
            var salt = bcrypt.genSaltSync(10);
            var hash = bcrypt.hashSync(password, salt);

            User.create({
                email: email,
                password: hash,
                name: name
            }).then(()=>{
                res.sendStatus(200);
            }).catch((err)=>{
                res.send(err);
            });

        }else{
            res.sendStatus(400);
        }
    });
});


app.post('/auth', (req, res)=>{
    var email = req.body.email;
    var password = req.body.password;

    User.findOne({where:{email: email}}).then(user=>{
        if(user != undefined){
            var correct = bcrypt.compareSync(password, user.password);

            if(correct){
                jwt.sign({id: user.id, email: user.email}, jwtSecret, {expiresIn:'24h'}, (err, token)=>{
                    if(err){
                        res.status(400);
                        res.json("Falha interna");
                    }else{
                        res.status(200);
                        res.json({token: token});
                    }
                })   
            }else{
                res.status(401);
                res.json("Senha ou Email invalidos!");
            }
        }else{
            res.status(404);
            res.json("Usuário não encontrado!");
        }
    });
});



app.listen(5000, ()=>{
    console.log("API Rodando!");
});
