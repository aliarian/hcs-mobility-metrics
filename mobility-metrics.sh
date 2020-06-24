#! /bin/sh

sudo apt-get update -q -y ##
sudo apt-get install awscli -q -y ##

sudo apt-get install build-essential git cmake -q -y ##
sudo apt-get install libboost-all-dev libtbb-dev liblua5.2-dev libluabind-dev libstxxl-dev libxml2 libxml2-dev libosmpbf-dev libbz2-dev libprotobuf-dev -q -y ##
sudo apt-get install osmium-tool -q -y ##

curl -sL https://deb.nodesource.com/setup_11.x | sudo -E bash -
sudo apt-get install nodejs -q -y

sudo chown -R ubuntu /usr/lib/node_modules ##
sudo npm install -g mobility-metrics --unsafe-perm=true --allow-root ##
sudo npm install -g osrm --unsafe-perm=true --allow-root ## 

sudo npm install -g trip-simulator@2.1.4 --unsafe-perm=true --allow-root ##there is a typo in v3.0.0 that prevents the correct start and end times from populating

cd /usr/lib/node_modules/mobility-metrics/example ##
aws s3 cp s3://hcs-tsmo-lake-resources/scripts/simulate_houston_no_osrm.js simulate_houston_no_osrm.js ##
aws s3 cp s3://hcs-tsmo-lake-resources/scripts/example_houston.json example_houston.json ##

node simulate_houston_no_osrm.js ##
cd /usr/lib/node_modules/mobility-metrics ##
currentday=$(date +'%Y-%m-%d')
tomorrow=$(date -d "tomorrow 13:00" '+%Y-%m-%d')
sudo mobility-metrics --config ./example/example_houston.json --public ./public --cache ./cache --startDay $currentday --endDay $tomorrow --reportDay $currentday ##

for fullfile in /usr/lib/node_modules/mobility-metrics/public/data/$currentday/*.json; do
	filename=$(basename -- "$fullfile")
	filebase="${filename%.*}"
	aws s3 cp /usr/lib/node_modules/mobility-metrics/public/data/$currentday/$filename s3://hcs-tsmo-lake/ingestion/mobility-metrics/daily/$currentday/$filebase/$filename
done

awsregion=$(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone | sed 's/\(.*\)[a-z]/\1/')
instance_id=$(curl http://169.254.169.254/latest/meta-data/instance-id)

#ec2role must be authorized to start execution on this state machine
aws s3 cp s3://hcs-tsmo-lake-resources/scripts/tokens/token.json token.json
token=$(jq '.token' token.json)
token=${token//\"}

aws stepfunctions send-task-success --task-token $token --task-output "{\"item1\":\"item1\", \"item2\":\"item2\", \"item3\":\"item3\", \"item4\":\"item4\"}" --region $awsregion

aws ec2 terminate-instances --instance-ids $instance_id --region $awsregion