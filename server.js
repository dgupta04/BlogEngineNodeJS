const express = require('express')
const app = express();
const http = require('http');
const server = http.createServer(app);
const expSession = require('express-session');
const passport = require('passport')
const passLocal = require('passport-local').Strategy;
const bcrypt = require('bcrypt')
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const port = process.env.PORT || 5000;
const client = require('mongodb').MongoClient
const mongoURL = "mongodb://localhost:27017";
const saltNumber = 10;
const path = require('path')
var db = null;
var coll = null;
var postsCollection = null;


// function checkUser(username, pass, trueFunc, falseFunc, res){
//     coll.find({"user": username.toString()}).toArray().then((arr)=>{
//         // console.log(arr.length);
//         if(arr.length === 0){
//             trueFunc(username, pass, res);
//         }
//         else{
//             falseFunc();
//         }
//     });
// }

function exists(){
    return false;
}

function addEntry(user, unhashedPass, req, res){    
    bcrypt.genSalt(saltNumber, (err, salt)=>{
        if(err){
            throw err;
        }
        else{
            bcrypt.hash(unhashedPass, salt, (err, hash)=>{
                if(err){
                    throw err;
                }
                else{
                    coll.insert({user: user, pass: hash, following: []}, ()=>{
                        req.login(user, (err)=>{
                            if(err){
                                throw err;
                            }
                            res.redirect('/profile');
                        });
                    });                    
                }                
            })
        }        
    })
}

function addPost(postBody, author, response){
    postsCollection.insertOne({author: author, body: postBody, likedBy: []}, ()=>{
        response.json({success: true});
    })
}

function checkPass(loginPass, retrPass, callback){
   bcrypt.compare(loginPass, retrPass, (err, res)=>{
       callback(res);
   })
}

function connectMongo(){
    client.connect(mongoURL, (err, client)=>{
        if(err){
            throw err;
        }
        else{
           db = client.db("main_db");
           coll = db.collection("users");
           postsCollection = db.collection("posts");
        }
    })
}

app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.text())
app.use(bodyParser.json());
app.use(cookieParser());
app.use(expSession({secret: "random session"}));
app.use(passport.initialize());
app.use(passport.session());

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use('/js', express.static('js'));
app.use('/stylesheets', express.static('css'));
app.use('/img', express.static('img'));

app.post('/checkUser', (req, res)=>{
    let username = req.body.username;
    console.log(req.body);
    coll.findOne({"user": username}, (err, arr)=>{
        if(err){
            throw err;
        }
        if(!arr){
            res.json({exists: false})
        }
        else{
            res.json({exists: true});
        }
    })
})  

app.get('/user/:id', (req, res)=>{
    if(req.user){
        if(req.user == req.params.id){
            res.redirect('/profile');
        }
        else{
            coll.findOne({"user": req.params.id}, (err, arr)=>{
                if(arr){
                    let peopleFollowing = arr.following;
                    let numFriends = peopleFollowing.length;
                    console.log(peopleFollowing);
                    console.log("num friends " + numFriends);
                    postsCollection.find({"author": req.params.id}).toArray((err, arr)=>{
                        let allPosts = arr;
                        allPosts.forEach(element =>{
                            let likedPeople = element.likedBy;
                            element.isLikedByUser = false;
                            likedPeople.forEach(likers =>{
                                element.isLikedByUser = element.isLikedByUser || (likers == req.user);
                            })
                        })
                        res.render('profilePage', {user: {handle: req.params.id,
                                                                    isSelf: false, 
                                                                    numFriends: numFriends}, 
                                                                    posts: allPosts});
                    });
                }
                else{
                    res.render('404');
                }
            });
        }
    }
    else{
        res.redirect('/');
    }
})

app.get('/error', (req, res)=>{
    res.render('404');
})

app.post('/searchUser', (req, res)=>{
    let sTerm = req.body.searchTerm;
    sTermRegex = '^' + sTerm + '.*';
    coll.find({"user":{$regex: sTermRegex}}).toArray((err, arr)=>{
        res.json(arr);
    })
})

app.get('/isFriend', (req, res)=>{
    let checkFollowFor = req.query.checkUser;
    // console.log(checkFollowFor);
    let isFriend = false;
    coll.findOne({"user": checkFollowFor}, (err, arr)=>{
        // console.log(arr);
        let followArr = arr.following;
        followArr.forEach(element => {
            isFriend = isFriend || (element == req.user)
        })
        res.json({isFriend : isFriend});
    })
})

app.post('/addFriend', (req, res)=>{
    let followReqFor = req.body.followRequestedFor;
    coll.update({"user": followReqFor}, {$push: { "following" : req.user}}, (err)=>{
        res.json({success: true});
    })
})

app.post('/removeFriend', (req, res)=>{
    let removeFollowFor = req.body.removeFollowFor;
    coll.update({"user": removeFollowFor}, {$pull: { "following" : req.user}}, (err)=>{
        res.json({success: true});
    })
})

app.get('/', (req, res)=>{
    if(req.user){
        res.redirect('/success');
    }
    else{
        res.render('index');
    }
})

app.get('/logout', (req, res)=>{
    req.logout();
    res.redirect('/');
})

app.get('/success', (req, res)=>{
    if(req.user){
        res.redirect('/profile');
    }
    else{
        res.redirect('/')
    }
})

app.post('/addPost', (req, res)=>{
    let newPost = req.body.newPost;
    let author = req.user;
    addPost(newPost, author, res);
})

app.get('/profile', (req, res)=>{
    if(!req.user){
        res.redirect('/')
    }
    else{
        coll.findOne({"user": req.user}, (err, arr)=>{
            let peopleFollowing = arr.following;
            let totalFriends = peopleFollowing.length
            postsCollection.find({"author": req.user}).toArray((err, arr)=>{
                let allPosts = arr;
                allPosts.forEach(element =>{
                    let likedPeople = element.likedBy;
                    element.isLikedByUser = false;
                    likedPeople.forEach(likers =>{
                        element.isLikedByUser = element.isLikedByUser || (likers == req.user);
                    })
                })
                res.render('profilePage', {user: {handle: req.user, 
                                                          isSelf: true,
                                                          numFriends: totalFriends},
                                                          posts: allPosts});
            });
        });       
    }
    
})

app.post('/signup', (req, res)=>{
    let username = req.body.username;
    let password = req.body.password;
    console.log(req.params);
    addEntry(username, password, req, res);
})  

app.post('/login', passport.authenticate('local',{
    successRedirect: '/profile',
    failureRedirect: '/'
}))

passport.use(new passLocal({usernameField: 'usernameLogin', passwordField: 'passwordLogin'}, (username, password, done)=>{
    coll.findOne({"user": `${username}`}, (err, data)=>{
        if(err){
            throw err;
        }
        if(data === null){
            return done(null, false, {message: "No such user exists!"});
        }
        if(data.user !== username){
            return done(null, false, {message: 'Incorrect Username'});
        }
        checkPass(password, data.pass, (comparePass)=>{
            // console.log(comparePass);
            if(!comparePass){
                return done(null, false, {message: 'Incorrect Pass'})
            }
            else{
                return done(null, username)
            }
        })
    })
}))

passport.serializeUser((user, done)=>{
    done(null, user);
})

passport.deserializeUser((user, done)=>{
    done(null, user);
})

app.listen(port, {useNewUrlParser: true}, ()=>{
    console.log("Server running at " + port);
    connectMongo();
})