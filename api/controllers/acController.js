'use strict';


var util = require('util')


var userTemperatures = new Map();

var checkingInterval = process.env.CHECKING_INTERVAL || 1*20*1000
var refreshInterval = process.env.REFRESH_INTERVAL || 1*60*1000

var defaultTemp = 22.0;
var currentTemperature = defaultTemp;

var UBoolean = require('../../Uncertainty/JavaScript/UBoolean');
var UReal = require('../../Uncertainty/JavaScript/UReal');


function checkUserActivity(){
    console.log("Current connected users: ");
    if(userTemperatures.size == 0){
        console.log("No users are connected");
    }else{
        for(var entry of userTemperatures.entries()){
            var userName = entry[0];
            var value = entry[1];
            var temperature = value.temperature;
            var seenCounter = value.seenCounter;
            console.log("User: " + userName + ", temperature: " + temperature + ", seen counter: " + seenCounter)
        }
    }

    console.log("Current temperature: " + currentTemperature);

    
}

function refreshUserList(){
    for(var entry of userTemperatures.entries()){
        var userName = entry[0];
        var value = entry[1];
        var temperature = value.temperature;
        var seenCounter = value.seenCounter;
        seenCounter--;
        if(seenCounter < 1){
            //remove user from list
            userTemperatures.delete(userName);
            console.log("Removed user " + userName + " from entries");
            setTemperature();
        }else{
            //decrement seenCounter
            userTemperatures.set(userName, {temperature, seenCounter})
            
        }
    }

    
}

function setTemperature(){
    
    if(userTemperatures.size == 0){
        //no users connected, set default temperature (or turn off)
        console.log("No users connected. Setting temperature to default: " + defaultTemp)
        currentTemperature = defaultTemp;
    }else{
        var temperature = 0.0;
        var uTemperature = new UReal(0.0, 0.5);

        for(var entry of userTemperatures.entries()){
            var value = entry[1];
            //temperature = UReal
            //temperature.add(valor de temperatura)
            
            uTemperature.setX(uTemperature.getX() + parseInt(value.temperature, 10));
            temperature = temperature + parseInt(value.temperature, 10);
        }

        uTemperature.setX(uTemperature.getX() / userTemperatures.size);
        //temperature.divideBy(size)
        temperature = temperature / userTemperatures.size
        //currentTemperature = temperature;
        currentTemperature = uTemperature.getX();
        console.log("Setting temperature to: " + currentTemperature) 
        console.log("Setting temperature to: " + uTemperature.toReal() + " with uncertainty +- " + uTemperature.getU());
        //console(valor ureal +- inc (temperature.toString())) o usar ureal.toReal()

    }
}

//execute this function periodically
setInterval(checkUserActivity, checkingInterval);
setInterval(refreshUserList, refreshInterval)
//setInterval(setTemperature, setTemperatureInterval)

exports.sendTemperature = function(req, res){
    var userName = req.body.userName;
    var temperature = req.body.temperature;
    var seenCounter = 2;
    var response;
    if(userTemperatures.get(userName) == undefined){
        //user does not exist, create new user
        userTemperatures.set(userName, {temperature, seenCounter});
        console.log("Added user: " + userName + " with temperature: "+ temperature); 
        response = "Added new user";
        setTemperature();
    }else{
        //user exists, update its seenCounter
        userTemperatures.set(userName, {temperature, seenCounter})
        console.log("Refreshed user " + userName + " counter");
        response = "Refreshed user"
    }
    res.send(response);
    
}

exports.get_script = function (req, res) {
  console.log("get AC script");
    var fs = require('fs');
    fs.readFile('Script/ACScript.bsh', 'UTF-8', function (err, data) {
        if (err) res.send(err);
        // console.log(data);
        var script = data;
        console.log("AC script sent");
        res.send(script);
      });
}

/*

var miUreal = new UReal(0.0, 0.0);

/*
console.log(miUreal.getX());
console.log(miUreal.setX(24.3));
console.log(miUreal.getX());

var x = new UReal(1.0, 0.0);
var y = new UReal(3.0, 0.0);
console.log(x.add(y));
console.log(x.minus(y));


var miUBoolean = new UBoolean();

console.log(miUBoolean.getB());
console.log(miUBoolean.getC());
*/
