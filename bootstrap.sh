#!/usr/bin/env bash

# Install the essentials
sudo apt-get update
sudo apt-get install -y build-essential
sudo apt-get install -y python-software-properties
sudo add-apt-repository -y ppa:chris-lea/node.js
sudo apt-get update
sudo apt-get install -y g++
sudo apt-get install -y nodejs
sudo apt-get install openjdk-7-jre-headless -y
sudo apt-get install -y curl
sudo apt-get install -y libssl0.9.8

# Install and Configure Couchbase
wget http://packages.couchbase.com/releases/2.5.1/couchbase-server-enterprise_2.5.1_x86_64.deb
sudo dpkg -i couchbase-server-enterprise_2.5.1_x86_64.deb
rm /home/vagrant/couchbase-server-enterprise_2.5.1_x86_64.deb
/bin/sleep 5
/opt/couchbase/bin/couchbase-cli cluster-init -c 127.0.0.1:8091 --cluster-init-username=admin --cluster-init-password=password --cluster-init-ramsize=2372
/opt/couchbase/bin/couchbase-cli bucket-create -c 127.0.0.1:8091 --bucket=openi --bucket-type=couchbase --bucket-ramsize=100 --bucket-replica=0 -u admin -p password

# Install Elasticsearch
wget https://download.elasticsearch.org/elasticsearch/elasticsearch/elasticsearch-1.0.1.deb
sudo dpkg -i elasticsearch-1.0.1.deb

# Install and Configure the Couchbase/Elasticsearch Plugin
sudo /usr/share/elasticsearch/bin/plugin -install transport-couchbase -url http://packages.couchbase.com.s3.amazonaws.com/releases/elastic-search-adapter/1.3.0/elasticsearch-transport-couchbase-1.3.0.zip
sudo /usr/share/elasticsearch/bin/plugin -install mobz/elasticsearch-head
sudo mkdir /usr/share/elasticsearch/templates
sudo wget https://raw2.github.com/couchbaselabs/elasticsearch-transport-couchbase/master/src/main/resources/couchbase_template.json -P /usr/share/elasticsearch/templates

sudo bash -c "echo couchbase.password: password >> /etc/elasticsearch/elasticsearch.yml"
sudo bash -c "echo couchbase.username: admin >> /etc/elasticsearch/elasticsearch.yml"
sudo bash -c "echo couchbase.maxConcurrentRequests: 1024 >> /etc/elasticsearch/elasticsearch.yml"
sudo service elasticsearch start

# Setup the Elasticsearch indexing parameters
until $(curl --output /dev/null --silent --head --fail http://192.168.33.10:9200); do
    printf '.'
    sleep 5
done
curl --retry 10 -XPUT http://192.168.33.10:9200/openi/ -d '{"index":{"analysis":{"analyzer":{"default":{"type":"whitespace","tokenizer":"whitespace"}}}}}'

# Setup the replication from Couchbase to Elasticsearch
curl -v -u admin:password http://192.168.33.10:8091/pools/default/remoteClusters -d name=elasticsearch -d hostname=192.168.33.10:9091 -d username=admin -d password=password
curl -v -X POST -u admin:password http://192.168.33.10:8091/controller/createReplication -d fromBucket=openi -d toCluster=elasticsearch -d toBucket=openi -d replicationType=continuous -d type=capi