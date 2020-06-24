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
console.log("copying houston osrm graph data from s3...");
exec(
  "aws s3 sync s3://hcs-tsmo-lake-resources/osrm/houston/graph/ /usr/lib/node_modules/mobility-metrics/example/graph/"
);

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