const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const connection = require('./database/database');
const Game = require('./model/Game');

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

connection.authenticate().then(()=>{
    console.log("DB conectada!");
}).catch((error)=>{
    console.log(error);
});

app.get('/games', (req, res)=>{
    Game.findAll().then((games)=>{
        res.json(games);
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

app.post('/game', (req, res)=>{
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


app.listen(5000, ()=>{
    console.log("API Rodando!");
});
