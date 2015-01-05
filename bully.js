var utils = require('utils');

/**
	bully.players = {
		'plaryUUID' : {
			pets : {
			}
		}
	}
	bully.owned = {
		
	}
*/

var bully = plugin('bully', {
	players : {},
	bullyCommand : function(sender, parameters){
		var commandName = parameters.shift();
		var params = {
				parameters: parameters,
				sender : sender
		};
		echo(sender, 'Executing: ' + commandName);
		this.commands[commandName](params);
	},
	
	// ------------------------- BEGIN COMMANDS --------------------------------
	commands : {
		pets : function(params){
			var player = params.sender;
			var pets = bully.getPets(player);
			var names = [];
			if(pets.length == 0){
				echo(player, 'You have no pets yet! Why don\'t you summon some up? (Make sure you summon them close to you.)');
				return;
			}
			for(var ndx in pets){
				if(ndx != 'length'){
					names.push(ndx);
				}
			}
			echo(player, 'Your pets are ' + names.join(', '));
		}
	},
	// ------------------------- END COMMANDS --------------------------------
	
	fight : function(player, mob1, mob2){
		if(!mob1.setAttackTarget){
			echo(player, mob1.name + ' is not a valid attacker');
			return;
		}
		if(!mob2.setAttackTarget){
			echo(player, mob2.name + ' is not a valid target');
			return;
		}
		mob1.setAttackTarget(mob2);
		mob1.setRevengeTarget(mob2);
		mob2.setAttackTarget(mob1);
		mob2.setRevengeTarget(mob1);			
		echo(player, mob1.name + ' versus ' + mob2.name + '! Fight! Fight! Fight!!!');	
	},
	
	getPlayers : function(){
		if(!this.players){
			this.players = {};
		}
		return this.players;
	},
	
	getOrAddPlayer : function(player){
		var players = this.getPlayers();
		var found = players[player.getUUID()];
		if(!found){
			found = this.createPlayer(player);
			players[player.getUUID()] = found;
		}
		return players[player.getUUID()];
	},
	
	createPlayer : function(player){
		var bullyPlayer = {
				name : player.name,
				player : player,
				lastClicked : false,
				pets : false
		};
		return bullyPlayer;
	},
	
	distanceFrom : function(e1, e2){
		var pos1 = e1.position, pos2 = e2.position;
		var d = {
			x : Math.floor(pos1.x - pos2.x), 
			y : Math.floor(pos1.y - pos2.y), 
			z : Math.floor(pos1.z - pos2.z)
		};
		//echo(e1, 'distanceFrom ' + e1.name + ' to ' + e2.name + ' = ' + JSON.stringify(d));
		return d;
	},

	getPetByName : function(player, name){
		var p = this.getOrAddPlayer(player);
		if(!p.pets){
			return false;
		}
		return p.pets[name] || false;
	},
	
	getPet : function(player, entity){
		var p = this.getOrAddPlayer(player);
		if(!p.pets){
			return false;
		}
		
		var pets = p.pets;
		for(var ndx in pets){
			if(pets[ndx] == entity){
				return ndx;
			}
		}
		return false;		
	},
	
	getPets : function(player){
		var bullyPlayer = this.getOrAddPlayer(player);
		if(!bullyPlayer.pets){
			bullyPlayer.pets = {
				length : 0
			};
		}
		return bullyPlayer.pets;
	},
	
	addPet : function(player, entity){				
		var pets = this.getPets(player);
		
		var input = require('input');
		input(player, 'What do you want to call your new pet? (Leave blank if you don\'t want a pet)', function(name, player, repeat){
		
			if (name == '' || name == 'q' || name == 'quit' || name == 'cancel'){
				echo(player, '(Pet not added)');
				return;
			}
		
			pets[name] = entity;
			pets.length++;
			echo(player, 'You have a new pet ' + entity.name + ' named ' + name + '! (Total pets: ' + pets.length + ')');
		});
	}
});

exports.bully = bully;

events.entityRightClick(function(ev){	
	var player = ev.player;
	var bullyPlayer = bully.getOrAddPlayer(player);
	var clickedEntity = ev.entity;
	
	var name = bully.getPet(player, clickedEntity);	
	if(bullyPlayer.lastClicked){	
		if(clickedEntity == bullyPlayer.lastClicked){
			bullyPlayer.lastClicked = false;
			echo(player, 'Awww, c\'mon!!! (Attack cancelled.)');
			return;
		}
		else{
			bully.fight(player, bullyPlayer.lastClicked, clickedEntity);
			echo(player, bullyPlayer.lastClicked.name + ' is attacking ' + clickedEntity.name + '!');
			bullyPlayer.lastClicked = false;
		}
	}
	else{
		bullyPlayer.lastClicked = clickedEntity;
		echo(player, bullyPlayer.lastClicked.name + ' is ready to fight! Click a target to start an attack.');	
	}
});


command('bully', function(parameters, sender) {
	bully.bullyCommand(sender, parameters);
});