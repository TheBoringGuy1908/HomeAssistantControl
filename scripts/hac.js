function homeAssistantRequest(path, method, body) {
	const url = game.settings.get("hac", "homeassistantUrl");
	const token = game.settings.get("hac", "homeassistantToken");
	
	if (!url || !token) {
		return;
	}
	
	return fetch(url + path, {
		method: method,
		headers: {
			Authorization: "Bearer " + token
		},
		body: JSON.stringify(body),
	});
}

function callService(domain, service, body) {
	homeAssistantRequest("/api/services/" + domain + "/" + service, "POST", body);
}

function getScenes(){
	let scenes = {};
	
	homeAssistantRequest("/api/states", "GET")
	.then(function(response){
		response.json().then(function(body){
			body.forEach(function(state){
				if (state.entity_id.startsWith("scene.")){
					scenes[state.entity_id] = state.attributes.friendly_name;
				}
			})
		});
	});
	
	return scenes;
}

Hooks.on("combatTurnChange", function(combat, prior, current) {
	const currentUser = game.user;
	if (!currentUser.isGM){
		return;
	}
	
	const playerId = combat.combatant.players[0]?.id ?? currentUser.id;
	const setting = game.settings.get("hac", playerId + "SceneName");
	if (!!setting){
		callService("scene", "turn_on", {entity_id: setting})
	}
});

Hooks.on("deleteCombat", function() {
	const currentUser = game.user;
	if (!currentUser.isGM){
		return;
	}
	
	const setting = game.settings.get("hac", "combatEndSceneName");
	if (!!setting){
		callService("scene", "turn_on", {entity_id: setting})
	}
});

Hooks.on("ready", function() {
	game.settings.register("hac", "homeassistantUrl", {
		name: "Home Assistant URL",
		scope: "client",
		config: true,
		type: String,
		requiresReload: true,
	});
	
	game.settings.register("hac", "homeassistantToken", {
		name: "Home Assistant API Token",
		scope: "client",
		config: true,
		type: String,
		requiresReload: true
	});
	
	scenes = getScenes();
	
	game.settings.register("hac", "combatStartSceneName", {
		name: "Combat Start Scene Name",
		scope: "client",
		config: true,
		type: String,
		requiresReload: false,
		choices: scenes
	});
	
	game.settings.register("hac", "combatEndSceneName", {
		name: "Combat End Scene Name",
		scope: "client",
		config: true,
		type: String,
		requiresReload: false,
		choices: scenes
	});
	
	const users = game.users
	users.forEach(function(user){	
		game.settings.register("hac", user.id + "SceneName", {
			name: user.name + " Scene Name",
			scope: "client",
			config: true,
			type: String,
			requiresReload: false,
			choices: scenes
		});
	});
});