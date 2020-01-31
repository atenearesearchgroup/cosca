'use strict';


var util = require('util')
var UBoolean = require('../../Uncertainty/JavaScript/UBoolean');
var UReal = require('../../Uncertainty/JavaScript/UReal');

var userTemperatures = new Map();

var checkingInterval = process.env.CHECKING_INTERVAL || 1*20*1000
var refreshInterval = process.env.REFRESH_INTERVAL || 1*60*1000

var idealTemperature = 24;

var defaultTemp = idealTemperature;
var currentTemperature = new UReal(defaultTemp, 1.0);
currentTemperature.setX(defaultTemp);




function checkUserActivity(){
    
    if(userTemperatures.size == 0){
        console.log("No users are connected");
    }else{
        console.log("Current connected users: ");
        for(var entry of userTemperatures.entries()){
            var userName = entry[0];
            var value = entry[1];
            var uTemperature = value.uTemperature;
            var seenCounter = value.seenCounter;
            console.log("User: " + userName + ", temperature: " + uTemperature.toString() + ", seen counter: " + seenCounter)
        }
    }

    console.log("Current temperature: " + currentTemperature.toString());

    
}

function refreshUserList(){
    for(var entry of userTemperatures.entries()){
        var userName = entry[0];
        var value = entry[1];
        var uTemperature = value.uTemperature;
        var seenCounter = value.seenCounter;
        seenCounter--;
        if(seenCounter < 1){
            //remove user from list
            userTemperatures.delete(userName);
            console.log("Removed user " + userName + " from entries");
            setTemperature();
        }else{
            //decrement seenCounter
            userTemperatures.set(userName, {uTemperature, seenCounter})
        }
    }

    
}

function setTemperature(){
    
    if(userTemperatures.size == 0){
        //no users connected, set default temperature (or turn off)
        console.log("No users connected. Setting temperature to default: " + defaultTemp)
        currentTemperature.setX(defaultTemp);
        currentTemperature.setU(1.0);
    }else{

        var uCalculatedTemperature = new UReal(0.0, 0.0);
        var sumOfWeights = 0.0;

        for(var entry of userTemperatures.entries()){

            //in case there ir only one measure, add a measure of ideal temperature as reference
            if(userTemperatures.size < 2){
                sumOfWeights = sumOfWeights + 1
                uCalculatedTemperature = uCalculatedTemperature.add(new UReal(idealTemperature, 0))

            }

            var value = entry[1];
            var weight = ProbabilityDistribution(value.uTemperature.getX())
            var uTemperature = new UReal(value.uTemperature.getX(), value.uTemperature.getU());
            uTemperature.setX(uTemperature.getX() * weight);
            //calculate the weight of this measure, copy the uReal of the current measure, multiply by its weight and add it to the total sum
            uCalculatedTemperature = uCalculatedTemperature.add(uTemperature);
            
            
            sumOfWeights = sumOfWeights + weight; //weighted average
        }

        uCalculatedTemperature.setX(uCalculatedTemperature.getX() / sumOfWeights)
        uCalculatedTemperature.setU(+uCalculatedTemperature.getU().toFixed(2)); //round to 2 decimals
        
        uCalculatedTemperature.setX(+uCalculatedTemperature.getX().toFixed(2))
        currentTemperature = uCalculatedTemperature;
        console.log("Setting temperature to: " + currentTemperature.toReal() + " with uncertainty " + currentTemperature.getU());

    }
}

//execute this function periodically
setInterval(checkUserActivity, checkingInterval);
setInterval(refreshUserList, refreshInterval)


exports.sendTemperature = function(req, res){
    var userName = req.body.userName;
    var temperature = parseFloat(req.body.temperature);
    var uTemperature = new UReal(temperature, 0.5);
    var seenCounter = 2;
    var response;

    if(userTemperatures.get(userName) == undefined){
        //user does not exist, create new user
        userTemperatures.set(userName, {uTemperature, seenCounter});
        console.log("Added user: " + userName + " with temperature: "+ uTemperature.toString()); 
        response = "Added new user";
        setTemperature();
    }else{
        //user exists, update its seenCounter

        if(userTemperatures.get(userName).uTemperature == uTemperature){
            //temperature didn't change
            userTemperatures.set(userName, {uTemperature, seenCounter})
            console.log("Refreshed user " + userName + " counter");
            response = "Refreshed user"
        }else{
            //if temperature changed, update current temperature
            userTemperatures.set(userName, {uTemperature, seenCounter})
            console.log("Refreshed user " + userName + " counter");
            response = "Refreshed user"
            setTemperature();
        }
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


function ProbabilityDistribution(value){
    var confidence = 1.0;
    var p = 0.125 //1/8
    var difference = Math.abs(value - idealTemperature);


    /**
     * inverse distance weighting
     * 
          confidence = ________1________
                        distance ^ 1/8
            
    */

    if(difference <1){
        confidence = 1
    }else{
                    
    confidence = 1/(Math.pow(difference,p));
    
    }
    return +confidence.toFixed(2)
}
