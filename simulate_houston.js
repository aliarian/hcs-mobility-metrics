const path = require("path");
const fs = require("fs");
const rimraf = require("rimraf");
const mkdirp = require("mkdirp");
const moment = require("moment");
const exec = require("child_process").execSync;

console.log("setting up data...");
const dir = path.join(__dirname, "data");
rimraf.sync(dir);
mkdirp.sync(dir);

console.log("generating graph...");
const graph = path.join(__dirname, "graph");
rimraf.sync(graph);
mkdirp.sync(graph);
console.log("downloading osm data...");
exec(
  "curl https://s3.amazonaws.com/metro-extracts.nextzen.org/houston_texas.osm.pbf -o graph/houston_texas.osm.pbf"
);
console.log("extracting houston...");
exec(
  'osmium extract -b "-95.586126,29.615581,-95.162003,29.963783" graph/houston_texas.osm.pbf -o graph/houston.osm.pbf -s "complete_ways"'
);
console.log("applying profile...");
exec(
  "../node_modules/osrm/lib/binding/osrm-extract graph/houston.osm.pbf -p ../node_modules/osrm/profiles/foot.lua;"
);
console.log("contracting...");
exec("../node_modules/osrm/lib/binding/osrm-contract graph/houston.osrm");

console.log("setting up providers...");
const providers = ["Flipr", "Scoob", "BikeMe", "Spuun"];

const days = 2;

const start = +(new Date());
//const start = 1563087600000; // Sunday, July 14, 2019 3:00:00 AM GMT-04:00

var cmd = "trip-simulator ";
cmd += "--config scooter ";
cmd += "--pbf graph/houston.osm.pbf ";
cmd += "--graph graph/houston.osrm ";
cmd += "--agents {agents} ";
cmd += "--start {start} ";
//cmd += "--seconds 60000 ";  //use this for trip-simulator >= 3.0.0
cmd += "--iterations 60000 "; //use this for trip-simulator <= 2.1.4
cmd += "--changes data/{provider}/changes.json ";
cmd += "--trips data/{provider}/trips.json ";
cmd += "--quiet ";

const minAgents = 50;
const maxAgents = 200;

console.log("running simulations...");

for (var day = 1; day <= days; day++) {
  console.log(day + " / " + days);
  console.log("- - -");
  const time = start + day * 86400000 + 21600;
  console.log(time.toString());

  for (let provider of providers) {
    console.log("  " + provider);
    mkdirp.sync(path.join(dir, provider));
    const agents = Math.round(
      Math.random() * (maxAgents - minAgents) + minAgents
    );

    var run = cmd;
    run = run.split("{agents}").join(agents);
    run = run.split("{start}").join(time.toString());
    run = run.split("{provider}").join(provider);
	
	console.log(run);
	
    exec(run);
  }
}