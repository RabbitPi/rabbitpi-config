const fs = require('fs');
var sys = require('sys');
var exec = require('child_process').exec;
var express = require('express');
var app = express();
app.use('/', express.static(__dirname + '/ui'));
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));


function scan(req, res) {
	exec("connmanctl enable wifi ; connmanctl scan wifi ; connmanctl services",
	function(error, stdout, stderr) {
		//Empty the know information about networks
		var networks = [];
		//split text line by line
		var text = stdout.split("\n");
		for (var line=0; line<text.length;line++) {
			//Process only WiFi networks
			var delimiterPosition = text[line].indexOf('wifi_');
			if (-1 === delimiterPosition) {
				continue;
			}
			var wifiName = text[line].substring(0, delimiterPosition).trim();
			var spacePosition = wifiName.indexOf(' ');
			if (-1 !== spacePosition) {
				wifiName = wifiName.substring(spacePosition);
			}
			var wifiId = text[line].substring(delimiterPosition).trim();
			var isOpen = ( -1 !== wifiId.indexOf('_managed_none'));
			networks.push({ name: wifiName, id: wifiId, open: isOpen });
		}
		res.json(networks);
	});
}

app.get('/scan', scan);

app.post('/save', function(req, res) {
        var fileWifiConfig = '/var/lib/connman/wifi.config'
        // Save WiFi configuration to a file
        var wifiData = "[service_wifi]\n";
        wifiData += "Type = wifi\n";
        wifiData += "Name = " + req.body.wifi.name + "\n";
        wifiData += "Passphrase = " + req.body.wifi.password + "\n"; 
        fs.writeFileSync(fileWifiConfig, wifiData);
        // Provide feedback
	var result = { error: 0, errCode: '' }
	res.json(result);
});

var server = app.listen(80, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('App listening at http://%s:%s', host, port);
});
